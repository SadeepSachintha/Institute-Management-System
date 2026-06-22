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
use Illuminate\Support\Facades\Mail;
use App\Mail\AbsenceNotificationMail;

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
                        Mail::to($parentEmail)->send(new AbsenceNotificationMail(
                            $studentName,
                            $student->student_id,
                            $date,
                            $subjectName
                        ));
                    } catch (\Exception $e) {
                        Log::error("Failed to send absence email to {$parentEmail}: " . $e->getMessage());
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

        return response()->json([
            'success' => true,
            'message' => 'Grade entered in gradebook successfully.',
            'grade' => $grade
        ]);
    }
}
