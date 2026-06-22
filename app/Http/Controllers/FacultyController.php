<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;
use App\Models\LeaveRequest;
use App\Models\Timetable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\LeaveStatusMail;

class FacultyController extends Controller
{
    /**
     * Get faculty listing, details, and workloads.
     */
    public function index()
    {
        $faculty = Faculty::with(['user', 'timetables.batch.course'])->get();
        
        // Calculate workload hours dynamically
        $workload = [];
        foreach ($faculty as $teacher) {
            $totalMinutes = 0;
            foreach ($teacher->timetables as $slot) {
                $start = strtotime($slot->start_time);
                $end = strtotime($slot->end_time);
                $totalMinutes += ($end - $start) / 60;
            }
            $totalHours = round($totalMinutes / 60, 2);
            
            $workload[] = [
                'faculty_id' => $teacher->id,
                'name' => $teacher->user->name,
                'department' => $teacher->department,
                'current_hours' => $totalHours,
                'max_hours' => $teacher->max_teaching_hours,
                'status' => $totalHours > $teacher->max_teaching_hours ? 'Overloaded' : ($totalHours == $teacher->max_teaching_hours ? 'Optimal' : 'Underutilized')
            ];
        }

        $leaves = LeaveRequest::with('faculty.user')->get();

        return response()->json([
            'faculty' => $faculty,
            'workload' => $workload,
            'leaves' => $leaves
        ]);
    }

    /**
     * Create leave request (Faculty).
     */
    public function storeLeave(Request $request)
    {
        $request->validate([
            'faculty_id' => 'required|exists:faculty,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
        ]);

        $leave = LeaveRequest::create([
            'faculty_id' => $request->faculty_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Leave request submitted successfully.',
            'leave' => $leave
        ]);
    }

    /**
     * Approve or reject a leave request (Admin).
     */
    public function updateLeaveStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected'
        ]);

        $leave = LeaveRequest::with('faculty.user')->findOrFail($id);
        $leave->update([
            'status' => $request->status
        ]);

        // Dispatch status update email
        try {
            Mail::to($leave->faculty->user->email)->send(new LeaveStatusMail(
                $leave->faculty->user->name,
                $leave->start_date,
                $leave->end_date,
                $leave->status,
                $leave->reason
            ));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send leave status email to {$leave->faculty->user->email}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Leave request has been " . strtoupper($request->status) . ".",
            'leave' => $leave
        ]);
    }
}
