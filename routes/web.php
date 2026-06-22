<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\AcademicController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuditController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Welcome Page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// React Dashboard SPA Page
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Core API endpoints protected by authentication
Route::middleware('auth')->group(function () {
    // 1. SIS / Admissions
    Route::get('/api/students', [AdmissionController::class, 'index']);
    Route::post('/api/students', [AdmissionController::class, 'store']);
    Route::post('/api/students/{id}/document', [AdmissionController::class, 'uploadDocument']);
    Route::post('/api/students/{id}/verify-document', [AdmissionController::class, 'verifyDocument']);

    // 2. Academics & Course Scheduling
    Route::get('/api/academic-structure', [AcademicController::class, 'getAcademicStructure']);
    Route::get('/api/timetable', [AcademicController::class, 'getTimetable']);
    Route::post('/api/timetable', [AcademicController::class, 'storeTimetable']);
    Route::get('/api/attendance', [AcademicController::class, 'getAttendance']);
    Route::post('/api/attendance', [AcademicController::class, 'submitAttendance']);
    Route::get('/api/grades/{studentId?}', [AcademicController::class, 'getGrades']);
    Route::post('/api/grades', [AcademicController::class, 'storeGrade']);
    Route::get('/api/students/{id}/report-card', [AcademicController::class, 'downloadReportCard']);

    // 3. Finance & Invoicing
    Route::get('/api/finance', [FinanceController::class, 'getFinancialDashboard']);
    Route::post('/api/finance/pay', [FinanceController::class, 'processSandboxPayment']);
    Route::post('/api/finance/bill-batch', [FinanceController::class, 'generateBatchBilling']);

    // 4. Faculty & leaves
    Route::get('/api/faculty', [FacultyController::class, 'index']);
    Route::post('/api/faculty/leave', [FacultyController::class, 'storeLeave']);
    Route::post('/api/faculty/leave/{id}/status', [FacultyController::class, 'updateLeaveStatus']);

    // 5. Predictive Analytics & AI
    Route::get('/api/analytics/student-risk/{studentId}', [AnalyticsController::class, 'getStudentRisk']);
    Route::get('/api/analytics/enrollment-forecast', [AnalyticsController::class, 'getEnrollmentForecast']);
    Route::post('/api/analytics/train', [AnalyticsController::class, 'retrainModel']);

    // 6. System Audit Logs
    Route::get('/api/audit-logs', [AuditController::class, 'index']);
});

require __DIR__.'/auth.php';
