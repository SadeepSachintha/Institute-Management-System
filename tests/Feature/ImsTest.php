<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\Course;
use App\Models\Batch;
use App\Models\Timetable;
use App\Models\Fee;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class ImsTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $faculty;
    protected $batch;
    protected $student;
    protected $fee;
    protected $invoice;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create admin user
        $this->adminUser = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin'
        ]);

        // 2. Create faculty
        $facultyUser = User::create([
            'name' => 'Dr. Alan Turing',
            'email' => 'alan@test.com',
            'password' => Hash::make('password'),
            'role' => 'faculty'
        ]);
        $this->faculty = Faculty::create([
            'user_id' => $facultyUser->id,
            'qualifications' => 'Ph.D. in Computer Science',
            'department' => 'CS',
            'max_teaching_hours' => 20
        ]);

        // 3. Create course and batch
        $course = Course::create([
            'name' => 'Computer Science',
            'code' => 'CS101',
            'description' => 'Test course'
        ]);
        $this->batch = Batch::create([
            'course_id' => $course->id,
            'name' => 'CS-2026-A',
            'semester' => 'Semester 1'
        ]);

        // 4. Create student profile (initially applicant)
        $studentUser = User::create([
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => Hash::make('password'),
            'role' => 'student'
        ]);
        $this->student = Student::create([
            'user_id' => $studentUser->id,
            'student_id' => 'TEMP-2026-9999',
            'status' => 'applicant'
        ]);

        // 5. Create fee and invoice
        $this->fee = Fee::create([
            'name' => 'Tuition Fee',
            'amount' => 1500.00,
            'due_date' => '2026-07-31'
        ]);
        $this->invoice = Invoice::create([
            'student_id' => $this->student->id,
            'fee_id' => $this->fee->id,
            'amount' => 1500.00,
            'discount' => 0.00,
            'status' => 'unpaid'
        ]);
    }

    /**
     * Test timetable validator prevents faculty scheduling conflict.
     */
    public function test_timetable_validator_blocks_overlapping_faculty_schedule()
    {
        $this->actingAs($this->adminUser);

        // Schedule first class: Monday 09:00 - 11:00
        Timetable::create([
            'batch_id' => $this->batch->id,
            'faculty_id' => $this->faculty->id,
            'subject_name' => 'Algorithms',
            'day_of_week' => 'Monday',
            'start_time' => '09:00',
            'end_time' => '11:00',
            'room_number' => 'Lab 1'
        ]);

        // Try to schedule overlapping class: Monday 10:00 - 12:00 for the SAME faculty
        $response = $this->postJson('/api/timetable', [
            'batch_id' => $this->batch->id,
            'faculty_id' => $this->faculty->id,
            'subject_name' => 'Database Systems',
            'day_of_week' => 'Monday',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'room_number' => 'Lab 2'
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['error' => true]);
        $this->assertStringContainsString('Scheduling conflict: Faculty already assigned', $response->json('message'));
    }

    /**
     * Test payment sandbox workflows triggers student status upgrade and automatic ID generation.
     */
    public function test_tuition_payment_triggers_enrollment_workflow_automation()
    {
        $this->actingAs($this->student->user);

        // Pay invoice in full
        $response = $this->postJson('/api/finance/pay', [
            'invoice_id' => $this->invoice->id,
            'amount_paid' => 1500.00,
            'payment_method' => 'Sandbox Card',
            'card_number' => '4111222233334444'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('invoice_status', 'paid');
        $response->assertJsonPath('workflow.triggered', true);
        $response->assertJsonPath('workflow.status', 'enrolled');

        // Verify Student ID was auto-generated and updated in DB
        $freshStudent = Student::find($this->student->id);
        $this->assertEquals('enrolled', $freshStudent->status);
        $this->assertStringStartsWith('STU-2026-', $freshStudent->student_id);
    }

    /**
     * Test report card generation and download.
     */
    public function test_download_report_card()
    {
        $this->actingAs($this->adminUser);

        // Enroll student in batch
        $this->student->batches()->attach($this->batch->id);

        $response = $this->get("/api/students/{$this->student->id}/report-card");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    /**
     * Test student document verification updates and persists document_status.
     */
    public function test_student_document_verification_persists_status()
    {
        $this->actingAs($this->adminUser);

        $this->student->update([
            'document_path' => 'documents/test.pdf',
            'document_status' => 'pending'
        ]);

        $response = $this->postJson("/api/students/{$this->student->id}/verify-document", [
            'status' => 'approved'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('student.document_status', 'approved');

        // Check DB state
        $freshStudent = Student::find($this->student->id);
        $this->assertEquals('approved', $freshStudent->document_status);
        $this->assertEquals('enrolled', $freshStudent->status);
    }

    /**
     * Test invoice PDF streaming inline.
     */
    public function test_invoice_pdf_streams_inline()
    {
        $this->actingAs($this->adminUser);

        $response = $this->get("/api/finance/invoices/{$this->invoice->id}/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Content-Disposition', 'inline; filename=Invoice_' . $this->invoice->id . '.pdf');
    }

    /**
     * Test receipt PDF streaming inline.
     */
    public function test_receipt_pdf_streams_inline()
    {
        $this->actingAs($this->adminUser);

        $payment = \App\Models\Payment::create([
            'invoice_id' => $this->invoice->id,
            'amount_paid' => 1500.00,
            'payment_method' => 'Sandbox Card',
            'transaction_reference' => 'TXN-TEST-9999',
            'payment_date' => \Carbon\Carbon::now()
        ]);

        $response = $this->get("/api/finance/payments/{$payment->id}/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $response->assertHeader('Content-Disposition', 'inline; filename=Receipt_' . $payment->transaction_reference . '.pdf');
    }

    /**
     * Test student can upload bank slip.
     */
    public function test_student_can_upload_bank_slip()
    {
        $this->actingAs($this->student->user);

        \Illuminate\Support\Facades\Storage::fake('public');

        $file = \Illuminate\Http\UploadedFile::fake()->image('slip.jpg');

        $response = $this->postJson("/api/finance/invoices/{$this->invoice->id}/upload-slip", [
            'slip' => $file
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('invoice.status', 'pending_verification');
        
        $freshInvoice = Invoice::find($this->invoice->id);
        $this->assertEquals('pending_verification', $freshInvoice->status);
        $this->assertNotNull($freshInvoice->slip_path);
    }

    /**
     * Test admin can approve bank slip.
     */
    public function test_admin_can_approve_bank_slip()
    {
        $this->invoice->update([
            'status' => 'pending_verification',
            'slip_path' => '/storage/slips/test.jpg'
        ]);

        $this->actingAs($this->adminUser);

        $response = $this->postJson("/api/finance/invoices/{$this->invoice->id}/verify-slip", [
            'status' => 'approve'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('invoice.status', 'paid');
        $response->assertJsonPath('workflow.triggered', true);

        // Verify payment record exists in DB
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $this->invoice->id,
            'payment_method' => 'Bank Transfer'
        ]);
        
        $freshStudent = Student::find($this->student->id);
        $this->assertEquals('enrolled', $freshStudent->status);
    }

    /**
     * Test admin can reject bank slip.
     */
    public function test_admin_can_reject_bank_slip()
    {
        $this->invoice->update([
            'status' => 'pending_verification',
            'slip_path' => '/storage/slips/test.jpg'
        ]);

        $this->actingAs($this->adminUser);

        $response = $this->postJson("/api/finance/invoices/{$this->invoice->id}/verify-slip", [
            'status' => 'reject',
            'remarks' => 'Slip image is blurry.'
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('invoice.status', 'unpaid');
        $this->assertNull(Invoice::find($this->invoice->id)->slip_path);
    }
}

