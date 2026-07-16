<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdmissionController;
use App\Http\Controllers\AcademicController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\Auth\SSOController;
use App\Http\Controllers\WebhookController;
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
    $user = auth()->user();
    if ($user && $user->role === 'student') {
        $profileExists = \App\Models\Student::where('user_id', $user->id)->exists();
        if (!$profileExists) {
            $year = date('Y');
            $random = rand(1000, 9999);
            $studentId = "TEMP-{$year}-{$random}";

            \App\Models\Student::create([
                'user_id' => $user->id,
                'student_id' => $studentId,
                'status' => 'applicant',
                'academic_history' => 'SSO Onboarded Student',
                'demographic_data' => 'OAuth Registered',
            ]);
        }
    }
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
    Route::post('/api/grades/bulk-import', [AcademicController::class, 'bulkImportGrades']);
    Route::get('/api/students/{id}/report-card', [AcademicController::class, 'downloadReportCard']);

    // 3. Finance & Invoicing
    Route::get('/api/finance', [FinanceController::class, 'getFinancialDashboard']);
    Route::post('/api/finance/pay', [FinanceController::class, 'processSandboxPayment']);
    Route::post('/api/finance/stripe-checkout', [FinanceController::class, 'createStripeSession']);
    Route::post('/api/finance/invoices/{id}/upload-slip', [FinanceController::class, 'uploadSlip']);
    Route::post('/api/finance/invoices/{id}/verify-slip', [FinanceController::class, 'verifySlip']);
    Route::post('/api/finance/bill-batch', [FinanceController::class, 'generateBatchBilling']);
    Route::get('/api/finance/invoices/{id}/pdf', [FinanceController::class, 'downloadInvoicePdf']);
    Route::get('/api/finance/payments/{id}/pdf', [FinanceController::class, 'downloadReceiptPdf']);

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
    Route::get('/api/audit-logs/export', [AuditController::class, 'exportCsv']);

    // 7. System Settings & Branding
    Route::get('/api/settings', [SystemSettingsController::class, 'getSettings']);
    Route::post('/api/settings', [SystemSettingsController::class, 'saveSettings']);
});

// Stripe Webhook Endpoint
Route::post('/stripe/webhook', [WebhookController::class, 'handleStripe'])->name('stripe.webhook');
Route::get('/api/finance/pay/mock-stripe-callback', [FinanceController::class, 'mockStripeCallback']);

// SSO Routes
Route::get('/auth/sso/redirect', [SSOController::class, 'redirectToProvider'])->name('auth.sso.redirect');
Route::get('/auth/sso/callback', [SSOController::class, 'handleProviderCallback'])->name('auth.sso.callback');
Route::get('/auth/sso/mock', [SSOController::class, 'handleMockLogin'])->name('auth.sso.mock');

require __DIR__.'/auth.php';
