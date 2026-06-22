<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Timetable;
use App\Models\Batch;
use App\Models\Course;
use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use App\Notifications\AbsenceNotification;
use App\Models\AuditLog;
use Barryvdh\DomPDF\Facade\Pdf;

class AcademicController extends Controller
{
    /**
     * Get batches and courses lists.
     */
    public function getAcademicStructure()
    {
        $courses = Course::with('batches')->get();
        $batches = Batch::with('course')->get();
        return response()->json([
            'courses' => $courses,
            'batches' => $batches
        ]);
    }

    /**
     * Fetch timetable list.
     */
    public function getTimetable()
    {
        $timetable = Timetable::with(['batch.course', 'faculty.user'])->get();
        return response()->json($timetable);
    }

    /**
     * Schedule a new slot with conflict resolution validation.
     */
    public function storeTimetable(Request $request)
    {
        $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'faculty_id' => 'required|exists:faculty,id',
            'subject_name' => 'required|string|max:255',
            'day_of_week' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room_number' => 'required|string|max:50',
        ]);

        $day = $request->day_of_week;
        $facultyId = $request->faculty_id;
        $room = $request->room_number;
        $startTime = $request->start_time;
        $endTime = $request->end_time;

        // Conflict check 1: Same faculty, same day, overlapping time slot
        $facultyConflict = Timetable::where('day_of_week', $day)
            ->where('faculty_id', $facultyId)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                });
            })
            ->first();

        if ($facultyConflict) {
            return response()->json([
                'error' => true,
                'message' => "Scheduling conflict: Faculty already assigned to '{$facultyConflict->subject_name}' in room {$facultyConflict->room_number} during this time ({$facultyConflict->start_time} - {$facultyConflict->end_time})."
            ], 422);
        }

        // Conflict check 2: Same room, same day, overlapping time slot
        $roomConflict = Timetable::where('day_of_week', $day)
            ->where('room_number', $room)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                });
            })
            ->first();

        if ($roomConflict) {
            return response()->json([
                'error' => true,
                'message' => "Scheduling conflict: Room {$room} is already booked for class '{$roomConflict->subject_name}' during this time ({$roomConflict->start_time} - {$roomConflict->end_time})."
            ], 422);
        }

        // Conflict check 3: Same student batch, same day, overlapping time slot
        $batchId = $request->batch_id;
        $batchConflict = Timetable::where('day_of_week', $day)
            ->where('batch_id', $batchId)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                });
            })
            ->first();

        if ($batchConflict) {
            return response()->json([
                'error' => true,
                'message' => "Scheduling conflict: Batch cohort is already scheduled for '{$batchConflict->subject_name}' in room {$batchConflict->room_number} during this time ({$batchConflict->start_time} - {$batchConflict->end_time})."
            ], 422);
        }

        $slot = Timetable::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Class scheduled successfully.',
            'timetable' => $slot->load(['batch.course', 'faculty.user'])
        ]);
    }

    /**
     * Fetch attendance records.
     */
    public function getAttendance(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date'
        ]);

        $date = $request->date ?? date('Y-m-d');
        $attendance = Attendance::with(['student.user', 'timetable'])->where('date', $date)->get();
        return response()->json($attendance);
    }

    /**
     * Submit class attendance and trigger parent absence alerts.
     */
    public function submitAttendance(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'timetable_id' => 'required|exists:timetables,id',
            'attendance_data' => 'required|array',
            'attendance_data.*.student_id' => 'required|exists:students,id',
            'attendance_data.*.status' => 'required|in:present,absent,late',
        ]);

        $date = $request->date;
        $timetableId = $request->timetable_id;
        $results = [];

        // Fetch timetable subject
        $timetableSlot = Timetable::find($timetableId);
        $subjectName = $timetableSlot ? $timetableSlot->subject_name : 'Class Slot';

        foreach ($request->attendance_data as $log) {
            $studentId = $log['student_id'];
            $status = $log['status'];

            // Parent alert flag
            $parentAlert = ($status === 'absent');

            $attendance = Attendance::updateOrCreate(
                ['student_id' => $studentId, 'timetable_id' => $timetableId, 'date' => $date],
                ['status' => $status, 'parent_alert_sent' => $parentAlert]
            );

            // Log / simulate automated notification trigger
            if ($parentAlert) {
                $student = Student::with('user', 'parents.user')->find($studentId);
                $studentName = $student->user->name;
                
                foreach ($student->parents as $p) {
                    $parentEmail = $p->user->email;
                    
                    try {
                        $p->user->notify(new AbsenceNotification(
                            $studentName,
                            $student->student_id,
                            $date,
                            $subjectName
                        ));
                    } catch (\Exception $e) {
                        Log::error("Failed to send absence notification to {$parentEmail}: " . $e->getMessage());
                    }

                    Log::channel('single')->warning(
                        "PARENT ALERT SENT to {$parentEmail}: Your child {$studentName} was marked ABSENT for timetable slot #{$timetableId} on {$date}."
                    );
                }
            }

            $results[] = $attendance;
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance logged successfully.',
            'data' => $results
        ]);
    }

    /**
     * Fetch student grades.
     */
    public function getGrades($studentId = null)
    {
        if ($studentId) {
            $grades = Grade::where('student_id', $studentId)->get();
        } else {
            $grades = Grade::with('student.user')->get();
        }
        return response()->json($grades);
    }

    /**
     * Add grade assessment to gradebook.
     */
    public function storeGrade(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_name' => 'required|string|max:255',
            'assessment_name' => 'required|string|max:255',
            'marks_obtained' => 'required|numeric|min:0',
            'max_marks' => 'required|numeric|min:1|gte:marks_obtained',
            'weight' => 'required|numeric|min:0.01|max:1.00',
        ]);

        $grade = Grade::create($request->all());

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'entered_grade',
                'auditable_type' => Grade::class,
                'auditable_id' => $grade->id,
                'old_values' => null,
                'new_values' => $grade->toArray(),
                'ip_address' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log grade entry audit log: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Grade entered in gradebook successfully.',
            'grade' => $grade
        ]);
    }

    /**
     * Generate and download a PDF report card for a student.
     */
    public function downloadReportCard(Request $request, $studentId)
    {
        $student = Student::with(['user', 'batches.course'])->findOrFail($studentId);
        
        $grades = Grade::where('student_id', $studentId)->get();
        
        $thresholdAPlus = floatval(\App\Models\Setting::get('grade_threshold_a_plus', 90));
        $thresholdA = floatval(\App\Models\Setting::get('grade_threshold_a', 80));
        $thresholdB = floatval(\App\Models\Setting::get('grade_threshold_b', 70));
        $thresholdC = floatval(\App\Models\Setting::get('grade_threshold_c', 60));

        $getLetterGrade = function ($percentage) use ($thresholdAPlus, $thresholdA, $thresholdB, $thresholdC) {
            if ($percentage >= $thresholdAPlus) return 'A+';
            if ($percentage >= $thresholdA) return 'A';
            if ($percentage >= $thresholdB) return 'B';
            if ($percentage >= $thresholdC) return 'C';
            return 'F';
        };

        $getGradePoint = function ($letter) {
            switch ($letter) {
                case 'A+': return 4.0;
                case 'A': return 3.7;
                case 'B': return 3.0;
                case 'C': return 2.0;
                default: return 0.0;
            }
        };

        $subjectGrades = [];
        $totalWeight = 0;
        $totalWeightedScore = 0;

        foreach ($grades as $g) {
            $ratio = $g->marks_obtained / $g->max_marks;
            $percent = $ratio * 100;
            $letter = $getLetterGrade($percent);
            $gp = $getGradePoint($letter);
            $weight = floatval($g->weight);

            $subjectGrades[] = [
                'subject_name' => $g->subject_name,
                'assessment_name' => $g->assessment_name,
                'weight' => $weight,
                'marks_obtained' => floatval($g->marks_obtained),
                'max_marks' => floatval($g->max_marks),
                'percentage' => round($percent, 1),
                'letter_grade' => $letter,
                'grade_point' => $gp,
            ];

            $totalWeightedScore += $percent * $weight;
            $totalWeight += $weight;
        }

        $overallAverage = $totalWeight > 0 ? round($totalWeightedScore / $totalWeight, 1) : 0;
        
        $cumulativeGPA = 0;
        $totalGPAs = 0;
        foreach ($subjectGrades as $sg) {
            $cumulativeGPA += $sg['grade_point'] * $sg['weight'];
            $totalGPAs += $sg['weight'];
        }
        $finalGPA = $totalGPAs > 0 ? round($cumulativeGPA / $totalGPAs, 2) : 0.0;

        $allStudents = Student::where('status', 'enrolled')->get();
        $rankings = [];

        foreach ($allStudents as $s) {
            $studentGrades = Grade::where('student_id', $s->id)->get();
            $sCumulative = 0;
            $sWeight = 0;
            
            foreach ($studentGrades as $g) {
                $percent = ($g->marks_obtained / $g->max_marks) * 100;
                $letter = $getLetterGrade($percent);
                $gp = $getGradePoint($letter);
                $weight = floatval($g->weight);
                
                $sCumulative += $gp * $weight;
                $sWeight += $weight;
            }
            
            $sGPA = $sWeight > 0 ? $sCumulative / $sWeight : 0.0;
            $rankings[$s->id] = $sGPA;
        }

        arsort($rankings);
        
        $rankPosition = 1;
        foreach ($rankings as $sid => $gpa) {
            if (intval($sid) === intval($studentId)) {
                break;
            }
            $rankPosition++;
        }
        $totalCohort = count($allStudents);

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'downloaded_report_card',
                'auditable_type' => Student::class,
                'auditable_id' => $student->id,
                'old_values' => null,
                'new_values' => [
                    'student_name' => $student->user->name,
                    'class_rank' => "{$rankPosition} of {$totalCohort}",
                    'gpa' => number_format($finalGPA, 2)
                ],
                'ip_address' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log report card download audit: " . $e->getMessage());
        }

        $data = [
            'student' => $student,
            'subjectGrades' => $subjectGrades,
            'overallAverage' => $overallAverage,
            'finalGPA' => number_format($finalGPA, 2),
            'classRank' => "{$rankPosition} of {$totalCohort}",
            'dateOfIssue' => date('F d, Y'),
        ];

        $pdf = Pdf::loadView('pdf.report_card', $data);
        
        return $pdf->download("Report_Card_{$student->student_id}.pdf");
    }

    /**
     * Bulk import grades from CSV.
     */
    public function bulkImportGrades(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        if (!$handle) {
            return response()->json(['success' => false, 'message' => 'Unable to open file.'], 400);
        }

        // Parse header row
        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return response()->json(['success' => false, 'message' => 'Empty CSV file.'], 400);
        }

        // Clean/normalize headers to find indexes
        $headerMapping = [];
        foreach ($headers as $index => $header) {
            $cleaned = strtolower(trim(str_replace(['_', ' '], '', $header)));
            $headerMapping[$cleaned] = $index;
        }

        $studentIdIndex = null;
        $subjectIndex = null;
        $assessmentIndex = null;
        $marksIndex = null;
        $maxMarksIndex = null;
        $weightIndex = null;

        foreach ($headerMapping as $cleaned => $index) {
            if (in_array($cleaned, ['studentid', 'student', 'stu', 'id'])) {
                $studentIdIndex = $index;
            } elseif (in_array($cleaned, ['subjectname', 'subject', 'course'])) {
                $subjectIndex = $index;
            } elseif (in_array($cleaned, ['assessmentname', 'assessment', 'label', 'exam', 'test'])) {
                $assessmentIndex = $index;
            } elseif (in_array($cleaned, ['marksobtained', 'marks', 'score', 'obtained'])) {
                $marksIndex = $index;
            } elseif (in_array($cleaned, ['maxmarks', 'maximummarks', 'max', 'total'])) {
                $maxMarksIndex = $index;
            } elseif (in_array($cleaned, ['weight', 'ratio', 'percentage', 'weightratio'])) {
                $weightIndex = $index;
            }
        }

        // If any required column index is missing, report error
        if ($studentIdIndex === null || $subjectIndex === null || $assessmentIndex === null || $marksIndex === null || $maxMarksIndex === null || $weightIndex === null) {
            fclose($handle);
            return response()->json([
                'success' => false,
                'message' => 'Invalid CSV headers. The CSV must contain columns for: Student ID, Subject Name, Assessment Name, Marks Obtained, Max Marks, and Weight.'
            ], 422);
        }

        $rowNum = 1; // Header is row 1
        $validationErrors = [];
        $rowsToInsert = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rowNum++;

            // Skip empty rows
            if (count($row) === 1 && empty($row[0])) {
                continue;
            }

            // Read cell values
            $rawStudentId = isset($row[$studentIdIndex]) ? trim($row[$studentIdIndex]) : '';
            $rawSubject = isset($row[$subjectIndex]) ? trim($row[$subjectIndex]) : '';
            $rawAssessment = isset($row[$assessmentIndex]) ? trim($row[$assessmentIndex]) : '';
            $rawMarks = isset($row[$marksIndex]) ? trim($row[$marksIndex]) : '';
            $rawMaxMarks = isset($row[$maxMarksIndex]) ? trim($row[$maxMarksIndex]) : '';
            $rawWeight = isset($row[$weightIndex]) ? trim($row[$weightIndex]) : '';

            // Validate Student
            if (empty($rawStudentId)) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => 'Student ID is required.'
                ];
                continue;
            }

            $student = Student::where('student_id', $rawStudentId)
                ->orWhere('id', $rawStudentId)
                ->first();

            if (!$student) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Student '{$rawStudentId}' not found in database."
                ];
                continue;
            }

            // Verify status is enrolled
            if ($student->status !== 'enrolled') {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Student '{$rawStudentId}' is not currently enrolled (Status: " . ucfirst($student->status) . ")."
                ];
                continue;
            }

            // Validate Subject
            if (empty($rawSubject)) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => 'Subject name is required.'
                ];
                continue;
            }

            // Validate Assessment
            if (empty($rawAssessment)) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => 'Assessment name is required.'
                ];
                continue;
            }

            // Validate Marks
            if ($rawMarks === '' || !is_numeric($rawMarks) || floatval($rawMarks) < 0) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Marks obtained '{$rawMarks}' must be a numeric value >= 0."
                ];
                continue;
            }
            $marksObtained = floatval($rawMarks);

            // Validate Max Marks
            if ($rawMaxMarks === '' || !is_numeric($rawMaxMarks) || floatval($rawMaxMarks) < 1) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Maximum marks '{$rawMaxMarks}' must be a numeric value >= 1."
                ];
                continue;
            }
            $maxMarks = floatval($rawMaxMarks);

            if ($marksObtained > $maxMarks) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Marks obtained ({$marksObtained}) cannot exceed maximum marks ({$maxMarks})."
                ];
                continue;
            }

            // Validate & Normalize Weight
            $cleanedWeight = rtrim($rawWeight, '%');
            if ($cleanedWeight === '' || !is_numeric($cleanedWeight)) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Weight '{$rawWeight}' must be numeric (e.g. 0.10 or 10%)."
                ];
                continue;
            }
            $weight = floatval($cleanedWeight);

            if ($weight > 1.0) {
                $weight = $weight / 100.0;
            }

            if ($weight < 0.01 || $weight > 1.00) {
                $validationErrors[] = [
                    'row' => $rowNum,
                    'student_id' => $rawStudentId,
                    'error' => "Weight ratio must resolve to a value between 0.01 and 1.00 (1% to 100%)."
                ];
                continue;
            }

            $rowsToInsert[] = [
                'student_db_id' => $student->id,
                'subject_name' => $rawSubject,
                'assessment_name' => $rawAssessment,
                'marks_obtained' => $marksObtained,
                'max_marks' => $maxMarks,
                'weight' => $weight,
            ];
        }
        fclose($handle);

        if (count($validationErrors) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Bulk import aborted due to validation errors. No records were saved.',
                'errors' => $validationErrors
            ], 422);
        }

        if (count($rowsToInsert) === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No valid data rows found in the CSV.'
            ], 422);
        }

        $insertedCount = 0;
        try {
            \Illuminate\Support\Facades\DB::transaction(function () use ($rowsToInsert, $request, &$insertedCount) {
                foreach ($rowsToInsert as $data) {
                    $grade = Grade::create([
                        'student_id' => $data['student_db_id'],
                        'subject_name' => $data['subject_name'],
                        'assessment_name' => $data['assessment_name'],
                        'marks_obtained' => $data['marks_obtained'],
                        'max_marks' => $data['max_marks'],
                        'weight' => $data['weight']
                    ]);

                    $insertedCount++;

                    AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'entered_grade',
                        'auditable_type' => Grade::class,
                        'auditable_id' => $grade->id,
                        'old_values' => null,
                        'new_values' => $grade->toArray(),
                        'ip_address' => $request->ip(),
                    ]);
                }
            });
        } catch (\Exception $e) {
            Log::error("Failed during bulk grade import database transaction: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'A database error occurred while saving grades: ' . $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully imported {$insertedCount} grade entries.",
            'imported_count' => $insertedCount
        ]);
    }
}

