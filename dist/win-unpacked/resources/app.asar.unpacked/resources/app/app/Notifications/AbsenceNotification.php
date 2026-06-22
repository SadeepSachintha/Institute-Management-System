<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Mail\AbsenceNotificationMail;

class AbsenceNotification extends Notification
{
    use Queueable;

    protected $studentName;
    protected $studentId;
    protected $date;
    protected $subjectName;

    /**
     * Create a new notification instance.
     */
    public function __construct($studentName, $studentId, $date, $subjectName)
    {
        $this->studentName = $studentName;
        $this->studentId = $studentId;
        $this->date = $date;
        $this->subjectName = $subjectName;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable)
    {
        return (new AbsenceNotificationMail(
            $this->studentName,
            $this->studentId,
            $this->date,
            $this->subjectName
        ))->to($notifiable->email);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'title' => 'Absence Notification Alert',
            'message' => "Your child {$this->studentName} ({$this->studentId}) was marked absent on {$this->date} for class {$this->subjectName}.",
            'student_id' => $this->studentId,
            'date' => $this->date,
            'subject_name' => $this->subjectName,
        ];
    }
}
