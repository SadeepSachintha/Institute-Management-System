<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear tables
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }
        DB::table('leave_requests')->truncate();
        DB::table('payments')->truncate();
        DB::table('invoices')->truncate();
        DB::table('fees')->truncate();
        DB::table('grades')->truncate();
        DB::table('attendance')->truncate();
        DB::table('timetables')->truncate();
        DB::table('faculty')->truncate();
        DB::table('parents')->truncate();
        DB::table('students')->truncate();
        DB::table('batch_student')->truncate();
        DB::table('batches')->truncate();
        DB::table('courses')->truncate();
        DB::table('users')->truncate();
        DB::table('settings')->truncate();
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        // Create Users
        $password = Hash::make('password');

        $adminId = DB::table('users')->insertGetId([
            'name' => 'Principal Administrator',
            'email' => 'admin@ims.com',
            'password' => $password,
            'role' => 'admin',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $faculty1UserId = DB::table('users')->insertGetId([
            'name' => 'Dr. Alan Turing',
            'email' => 'alan@ims.com',
            'password' => $password,
            'role' => 'faculty',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $faculty2UserId = DB::table('users')->insertGetId([
            'name' => 'Dr. Grace Hopper',
            'email' => 'grace@ims.com',
            'password' => $password,
            'role' => 'faculty',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student1UserId = DB::table('users')->insertGetId([
            'name' => 'John Doe',
            'email' => 'john@ims.com',
            'password' => $password,
            'role' => 'student',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student2UserId = DB::table('users')->insertGetId([
            'name' => 'Jane Smith',
            'email' => 'jane@ims.com',
            'password' => $password,
            'role' => 'student',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student3UserId = DB::table('users')->insertGetId([
            'name' => 'Alice Cooper',
            'email' => 'alice@ims.com',
            'password' => $password,
            'role' => 'student',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student4UserId = DB::table('users')->insertGetId([
            'name' => 'Bob Marley',
            'email' => 'bob@ims.com',
            'password' => $password,
            'role' => 'student',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $parentId = DB::table('users')->insertGetId([
            'name' => 'Sarah Doe',
            'email' => 'sarah@ims.com',
            'password' => $password,
            'role' => 'parent',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Courses
        $course1Id = DB::table('courses')->insertGetId([
            'name' => 'B.Sc. Computer Science',
            'code' => 'CS101',
            'description' => 'Comprehensive study of computing paradigms, algorithms, and software engineering.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $course2Id = DB::table('courses')->insertGetId([
            'name' => 'B.Sc. Data Science',
            'code' => 'DS201',
            'description' => 'Advanced statistics, machine learning pipelines, and data visualization analytics.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Batches
        $batch1Id = DB::table('batches')->insertGetId([
            'course_id' => $course1Id,
            'name' => 'CS-2026-A',
            'semester' => 'Semester 1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $batch2Id = DB::table('batches')->insertGetId([
            'course_id' => $course2Id,
            'name' => 'DS-2026-A',
            'semester' => 'Semester 1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Students Profiles
        $student1Id = DB::table('students')->insertGetId([
            'user_id' => $student1UserId,
            'student_id' => 'STU-2026-0001',
            'status' => 'enrolled',
            'academic_history' => 'GPA: 3.5 in High School. Prefers algorithms.',
            'medical_records' => 'No allergies recorded.',
            'demographic_data' => 'Address: 123 Main St, London.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student2Id = DB::table('students')->insertGetId([
            'user_id' => $student2UserId,
            'student_id' => 'STU-2026-0002',
            'status' => 'enrolled',
            'academic_history' => 'GPA: 3.9 in High School. Prefers databases.',
            'medical_records' => 'Penicillin allergy.',
            'demographic_data' => 'Address: 456 Park Ave, New York.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student3Id = DB::table('students')->insertGetId([
            'user_id' => $student3UserId,
            'student_id' => 'STU-2026-0003',
            'status' => 'applicant',
            'academic_history' => 'GPA: 3.2 in High School.',
            'medical_records' => 'None.',
            'demographic_data' => 'Address: 789 Oak Rd, Chicago.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $student4Id = DB::table('students')->insertGetId([
            'user_id' => $student4UserId,
            'student_id' => 'STU-2026-0004',
            'status' => 'inquiry',
            'academic_history' => 'Inquiry for computer science course structure.',
            'medical_records' => 'None.',
            'demographic_data' => 'Address: 101 Pine Dr, Kingston.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Enroll students in batches
        DB::table('batch_student')->insert([
            ['student_id' => $student1Id, 'batch_id' => $batch1Id, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student2Id, 'batch_id' => $batch1Id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Parents Profiles
        DB::table('parents')->insert([

            'user_id' => $parentId,
            'student_id' => $student1Id,
            'relationship' => 'Mother',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Faculty Profiles
        $faculty1Id = DB::table('faculty')->insertGetId([
            'user_id' => $faculty1UserId,
            'qualifications' => 'Ph.D. in Computer Science (Cambridge)',
            'department' => 'Computer Science',
            'max_teaching_hours' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $faculty2Id = DB::table('faculty')->insertGetId([
            'user_id' => $faculty2UserId,
            'qualifications' => 'Ph.D. in Applied Mathematics (Yale)',
            'department' => 'Mathematics',
            'max_teaching_hours' => 18,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Timetables
        $t1Id = DB::table('timetables')->insertGetId([
            'batch_id' => $batch1Id,
            'faculty_id' => $faculty1Id,
            'subject_name' => 'Data Structures & Algorithms',
            'day_of_week' => 'Monday',
            'start_time' => '09:00:00',
            'end_time' => '11:00:00',
            'room_number' => 'Lab 1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $t2Id = DB::table('timetables')->insertGetId([
            'batch_id' => $batch1Id,
            'faculty_id' => $faculty2Id,
            'subject_name' => 'Linear Algebra',
            'day_of_week' => 'Wednesday',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'room_number' => 'Lecture Hall B',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $t3Id = DB::table('timetables')->insertGetId([
            'batch_id' => $batch2Id,
            'faculty_id' => $faculty1Id,
            'subject_name' => 'Machine Learning Foundations',
            'day_of_week' => 'Tuesday',
            'start_time' => '13:00:00',
            'end_time' => '15:00:00',
            'room_number' => 'Seminar Room 2',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Attendance
        // Seed some history logs
        $dates = [
            Carbon::now()->subDays(10)->format('Y-m-d'),
            Carbon::now()->subDays(9)->format('Y-m-d'),
            Carbon::now()->subDays(8)->format('Y-m-d'),
            Carbon::now()->subDays(7)->format('Y-m-d'),
            Carbon::now()->subDays(6)->format('Y-m-d'),
            Carbon::now()->subDays(5)->format('Y-m-d'),
            Carbon::now()->subDays(4)->format('Y-m-d'),
            Carbon::now()->subDays(3)->format('Y-m-d'),
            Carbon::now()->subDays(2)->format('Y-m-d'),
            Carbon::now()->subDays(1)->format('Y-m-d'),
        ];

        // Student 1 (John Doe) - Starts good, then drops. This is to test the Early Warning Model!
        $johnAttendance = ['present', 'present', 'present', 'present', 'absent', 'absent', 'present', 'absent', 'absent', 'absent'];
        foreach ($dates as $index => $date) {
            DB::table('attendance')->insert([
                'student_id' => $student1Id,
                'timetable_id' => $t1Id,
                'date' => $date,
                'status' => $johnAttendance[$index],
                'parent_alert_sent' => $johnAttendance[$index] === 'absent',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Student 2 (Jane Smith) - Perfect attendance
        foreach ($dates as $date) {
            DB::table('attendance')->insert([
                'student_id' => $student2Id,
                'timetable_id' => $t1Id,
                'date' => $date,
                'status' => 'present',
                'parent_alert_sent' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Grades
        // John Doe - Grades starting to drop
        DB::table('grades')->insert([
            ['student_id' => $student1Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Assignment 1', 'marks_obtained' => 85.00, 'max_marks' => 100.00, 'weight' => 0.10, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student1Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Midterm Exam', 'marks_obtained' => 62.00, 'max_marks' => 100.00, 'weight' => 0.30, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student1Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Quiz 1', 'marks_obtained' => 45.00, 'max_marks' => 100.00, 'weight' => 0.05, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student1Id, 'subject_name' => 'Linear Algebra', 'assessment_name' => 'Midterm Exam', 'marks_obtained' => 55.00, 'max_marks' => 100.00, 'weight' => 0.40, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Jane Smith - Excellent grades
        DB::table('grades')->insert([
            ['student_id' => $student2Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Assignment 1', 'marks_obtained' => 95.00, 'max_marks' => 100.00, 'weight' => 0.10, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student2Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Midterm Exam', 'marks_obtained' => 92.00, 'max_marks' => 100.00, 'weight' => 0.30, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student2Id, 'subject_name' => 'Data Structures', 'assessment_name' => 'Quiz 1', 'marks_obtained' => 88.00, 'max_marks' => 100.00, 'weight' => 0.05, 'created_at' => now(), 'updated_at' => now()],
            ['student_id' => $student2Id, 'subject_name' => 'Linear Algebra', 'assessment_name' => 'Midterm Exam', 'marks_obtained' => 90.00, 'max_marks' => 100.00, 'weight' => 0.40, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Fees Definition
        $fee1Id = DB::table('fees')->insertGetId([
            'name' => 'Tuition Fee - CS Semester 1',
            'amount' => 1500.00,
            'due_date' => Carbon::now()->addDays(30)->format('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $fee2Id = DB::table('fees')->insertGetId([
            'name' => 'Registration Deposit',
            'amount' => 300.00,
            'due_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Billing Invoices
        // John Doe: paid tuition invoice
        $invoice1Id = DB::table('invoices')->insertGetId([
            'student_id' => $student1Id,
            'fee_id' => $fee1Id,
            'amount' => 1500.00,
            'discount' => 100.00, // Scholarship
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Jane Smith: paid tuition invoice
        $invoice2Id = DB::table('invoices')->insertGetId([
            'student_id' => $student2Id,
            'fee_id' => $fee1Id,
            'amount' => 1500.00,
            'discount' => 0.00,
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Alice Cooper: unpaid registration invoice
        $invoice3Id = DB::table('invoices')->insertGetId([
            'student_id' => $student3Id,
            'fee_id' => $fee2Id,
            'amount' => 300.00,
            'discount' => 0.00,
            'status' => 'unpaid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Payments
        DB::table('payments')->insert([
            [
                'invoice_id' => $invoice1Id,
                'amount_paid' => 1400.00,
                'payment_method' => 'Sandbox Card',
                'transaction_reference' => 'TXN-99882233',
                'payment_date' => Carbon::now()->subDays(12),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'invoice_id' => $invoice2Id,
                'amount_paid' => 1500.00,
                'payment_method' => 'Bank Transfer',
                'transaction_reference' => 'TXN-77665544',
                'payment_date' => Carbon::now()->subDays(15),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // Leave Requests
        DB::table('leave_requests')->insert([
            [
                'faculty_id' => $faculty1Id,
                'start_date' => Carbon::now()->addDays(5)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(7)->format('Y-m-d'),
                'reason' => 'Attending academic research symposium.',
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'faculty_id' => $faculty2Id,
                'start_date' => Carbon::now()->addDays(12)->format('Y-m-d'),
                'end_date' => Carbon::now()->addDays(13)->format('Y-m-d'),
                'reason' => 'Medical appointment.',
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        $this->call(SettingsSeeder::class);
    }
}
