<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Courses
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Batches (Academic groups)
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('semester');
            $table->timestamps();
        });

        // 3. Students
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('student_id')->unique(); // e.g. STU-2026-0001
            $table->string('status')->default('inquiry'); // inquiry, applicant, enrolled, alumni
            $table->text('academic_history')->nullable();
            $table->text('medical_records')->nullable();
            $table->text('demographic_data')->nullable();
            $table->string('document_path')->nullable();
            $table->timestamps();
        });

        // 4. Parents / Guardians
        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('relationship'); // Father, Mother, Guardian
            $table->timestamps();
        });

        // 5. Faculty / Staff
        Schema::create('faculty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('qualifications');
            $table->string('department');
            $table->integer('max_teaching_hours')->default(20);
            $table->timestamps();
        });

        // 6. Timetables (Schedules with conflict checking logic)
        Schema::create('timetables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->onDelete('cascade');
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('cascade');
            $table->string('subject_name');
            $table->string('day_of_week'); // Monday, Tuesday, etc.
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room_number');
            $table->timestamps();
        });

        // 7. Attendance
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('timetable_id')->nullable()->constrained()->onDelete('set null');
            $table->date('date');
            $table->string('status'); // present, absent, late
            $table->boolean('parent_alert_sent')->default(false);
            $table->timestamps();
        });

        // 8. Grades (Assessments & Gradebook)
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('subject_name');
            $table->string('assessment_name'); // e.g. Midterm, Final, Assignment 1
            $table->decimal('marks_obtained', 5, 2);
            $table->decimal('max_marks', 5, 2);
            $table->decimal('weight', 3, 2)->default(1.00); // weight factor e.g. 0.30 for midterm
            $table->timestamps();
        });

        // 9. Fees
        Schema::create('fees', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Tuition Fee, Library Fee, Transport Fee
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->timestamps();
        });

        // 10. Invoices (Student specific billing)
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('fee_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->decimal('discount', 10, 2)->default(0.00);
            $table->string('status')->default('unpaid'); // unpaid, paid, partially_paid
            $table->timestamps();
        });

        // 11. Payments (Online Tuition Sandbox payments)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_paid', 10, 2);
            $table->string('payment_method'); // Card, Bank, Cash, Sandbox
            $table->string('transaction_reference')->unique();
            $table->timestamp('payment_date');
            $table->timestamps();
        });

        // 12. Faculty Leave Management
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained('faculty')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->text('reason');
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('fees');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('timetables');
        Schema::dropIfExists('faculty');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('students');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('courses');
    }
};
