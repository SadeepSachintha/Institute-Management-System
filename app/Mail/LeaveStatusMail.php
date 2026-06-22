<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $facultyName;
    public $startDate;
    public $endDate;
    public $status;
    public $reason;

    /**
     * Create a new message instance.
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
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Leave Request Status Update - IMS HR',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.leave_status',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
