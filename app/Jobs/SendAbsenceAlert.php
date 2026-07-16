<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Attendance;
use Illuminate\Support\Facades\Log;

class SendAbsenceAlert implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    protected $attendance;

    public function __construct(Attendance $attendance)
    {
        $this->attendance = $attendance;
    }

    public function handle(): void
    {
        // Load relationships safely
        $attendance = $this->attendance;
        $student = $attendance->student;
        if (!$student) {
            return;
        }

        $studentParents = $student->parents;
        if ($studentParents->isEmpty()) {
            Log::warning("No parent registered for absent student: {$student->student_id}");
            return;
        }

        foreach ($studentParents as $studentParent) {
            $parentUser = $studentParent->user;
            if ($parentUser) {
                Log::info("Asynchronously dispatching absence alert to parent '{$parentUser->name}' ({$parentUser->email}) for student STU ID: {$student->student_id}");
                
                // Real implementation:
                // Mail::to($parentUser->email)->send(new StudentAbsenceMail($student, $attendance));
            }
        }

        // Mark the alert as sent
        $attendance->update(['parent_alert_sent' => true]);
    }
}
