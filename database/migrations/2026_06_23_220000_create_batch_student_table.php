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
        Schema::create('batch_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('batch_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Auto-link existing seeded students to their batch if they exist
        $batch = \Illuminate\Support\Facades\DB::table('batches')->where('name', 'CS-2026-A')->first();
        if ($batch) {
            $students = \Illuminate\Support\Facades\DB::table('students')
                ->whereIn('student_id', ['STU-2026-0001', 'STU-2026-0002'])
                ->get();
            foreach ($students as $student) {
                \Illuminate\Support\Facades\DB::table('batch_student')->insertOrIgnore([
                    'student_id' => $student->id,
                    'batch_id' => $batch->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batch_student');
    }
};
