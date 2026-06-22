<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Mail\LeaveStatusMail;

class LeaveStatusNotification extends Notification
{
    use Queueable;

    protected $facultyName;
    protected $startDate;
    protected $endDate;
    protected $status;
    protected $reason;

    /**
     * Create a new notification instance.
     */
    public function __construct($facultyName, $startDate, $endDate, $status, $reason)
    {
        $this->facultyName = $facultyName;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->status = $status;
        $this->reason = $reason;
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
        return (new LeaveStatusMail(
            $this->facultyName,
            $this->startDate,
            $this->endDate,
            $this->status,
            $this->reason
        ))->to($notifiable->email);
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'title' => 'Leave Request Status Update',
            'message' => "Your leave request for dates {$this->startDate} to {$this->endDate} has been " . strtoupper($this->status) . ".",
            'status' => $this->status,
            'start_date' => $this->startDate,
            'end_date' => $this->endDate,
        ];
    }
}
