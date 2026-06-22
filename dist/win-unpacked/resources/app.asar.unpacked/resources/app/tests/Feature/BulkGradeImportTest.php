<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\Course;
use App\Models\Batch;
use App\Models\Grade;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

class BulkGradeImportTest extends TestCase
{
    use RefreshDatabase;

    protected $facultyUser;
    protected $enrolledStudent;
    protected $applicantStudent;

    protected function setUp(): void
    {
        parent::setUp();

        // Create faculty user
        $this->facultyUser = User::create([
            'name' => 'Dr. Alan Turing',
            'email' => 'alan@test.com',
            'password' => Hash::make('password'),
            'role' => 'faculty'
        ]);

        // Create enrolled student
        $studentUser1 = User::create([
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => Hash::make('password'),
            'role' => 'student'
        ]);
        $this->enrolledStudent = Student::create([
            'user_id' => $studentUser1->id,
            'student_id' => 'STU-2026-0001',
            'status' => 'enrolled'
        ]);

        // Create applicant student
        $studentUser2 = User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@test.com',
            'password' => Hash::make('password'),
            'role' => 'student'
        ]);
        $this->applicantStudent = Student::create([
            'user_id' => $studentUser2->id,
            'student_id' => 'STU-2026-0002',
            'status' => 'applicant'
        ]);
    }

    /**
     * Test validation failure cases inside the CSV bulk import.
     */
    public function test_bulk_import_fails_with_validation_errors()
    {
        $this->actingAs($this->facultyUser);

        // Row 2: Invalid student ID
        // Row 3: Enrolled student, but marks_obtained (120) > max_marks (100)
        // Row 4: Applicant student (not enrolled)
        // Row 5: Enrolled student, but invalid weight
        $csvContent = "Student ID,Subject Name,Assessment Name,Marks Obtained,Max Marks,Weight\n" .
                      "STU-INVALID,Data Structures,Assignment 2,85,100,10%\n" .
                      "STU-2026-0001,Data Structures,Assignment 2,120,100,10%\n" .
                      "STU-2026-0002,Data Structures,Assignment 2,80,100,10%\n" .
                      "STU-2026-0001,Data Structures,Assignment 2,85,100,INVALID_WEIGHT\n";

        $file = UploadedFile::fake()->createWithContent('grades.csv', $csvContent);

        $response = $this->postJson('/api/grades/bulk-import', [
            'file' => $file
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
        $response->assertJsonCount(4, 'errors');

        // Check if correct errors are mapped to correct row numbers
        $errors = $response->json('errors');
        
        $this->assertEquals(2, $errors[0]['row']);
        $this->assertStringContainsString("not found in database", $errors[0]['error']);

        $this->assertEquals(3, $errors[1]['row']);
        $this->assertStringContainsString("cannot exceed maximum marks", $errors[1]['error']);

        $this->assertEquals(4, $errors[2]['row']);
        $this->assertStringContainsString("not currently enrolled", $errors[2]['error']);

        $this->assertEquals(5, $errors[3]['row']);
        $this->assertStringContainsString("must be numeric", $errors[3]['error']);

        // Assert database is empty (All-or-Nothing rollback check)
        $this->assertEquals(0, Grade::count());
        $this->assertEquals(0, AuditLog::where('action', 'entered_grade')->count());
    }

    /**
     * Test successful bulk import of grade records.
     */
    public function test_bulk_import_succeeds_with_valid_data()
    {
        $this->actingAs($this->facultyUser);

        // Row 2: valid student ID, weight in % format
        // Row 3: valid student ID, weight in decimal format
        $csvContent = "Student ID,Subject Name,Assessment Name,Marks Obtained,Max Marks,Weight\n" .
                      "STU-2026-0001,Data Structures,Assignment 2,88.5,100,10%\n" .
                      "STU-2026-0001,Data Structures,Midterm Exam,40,50,0.30\n";

        $file = UploadedFile::fake()->createWithContent('grades.csv', $csvContent);

        $response = $this->postJson('/api/grades/bulk-import', [
            'file' => $file
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('imported_count', 2);

        // Verify records in database
        $this->assertEquals(2, Grade::count());
        
        $grade1 = Grade::where('assessment_name', 'Assignment 2')->first();
        $this->assertNotNull($grade1);
        $this->assertEquals($this->enrolledStudent->id, $grade1->student_id);
        $this->assertEquals(88.5, $grade1->marks_obtained);
        $this->assertEquals(100.0, $grade1->max_marks);
        $this->assertEquals(0.10, $grade1->weight);

        $grade2 = Grade::where('assessment_name', 'Midterm Exam')->first();
        $this->assertNotNull($grade2);
        $this->assertEquals(40.0, $grade2->marks_obtained);
        $this->assertEquals(50.0, $grade2->max_marks);
        $this->assertEquals(0.30, $grade2->weight);

        // Verify audit logs were created
        $this->assertEquals(2, AuditLog::where('action', 'entered_grade')->count());
    }
}
