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
}
