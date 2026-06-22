<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbsenceNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $studentName;
    public $studentId;
    public $date;
    public $subjectName;

    /**
     * Create a new message instance.
     */
    public function __construct($studentName, $studentId, $date, $subjectName)
    {
        $this->studentName = $studentName;
        $this->studentId = $studentId;
        $this->date = $date;
        $this->subjectName = $subjectName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Student Absence Notification - IMS Portal',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.absence',
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
