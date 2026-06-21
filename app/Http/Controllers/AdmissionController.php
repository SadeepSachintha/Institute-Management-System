<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Fee;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdmissionController extends Controller
{
    /**
     * Get students profile details and status logs.
     */
    public function index()
    {
        $students = Student::with('user')->get();
        return response()->json($students);
    }

    /**
     * Onboard a new student inquiry / applicant.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'status' => 'required|string|in:inquiry,applicant,enrolled',
            'academic_history' => 'nullable|string',
            'demographic_data' => 'nullable|string',
            'fee_id' => 'nullable|exists:fees,id'
        ]);

        return DB::transaction(function () use ($request) {
            // Create user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make('password'), // default password
                'role' => 'student',
            ]);

            // Auto-generate student temporary ID
            $year = date('Y');
            $random = rand(1000, 9999);
            $studentId = "TEMP-{$year}-{$random}";

            // Create student profile
            $student = Student::create([
                'user_id' => $user->id,
                'student_id' => $studentId,
                'status' => $request->status,
                'academic_history' => $request->academic_history,
                'demographic_data' => $request->demographic_data,
            ]);

            // If applicant, trigger a registration fee invoice
            if ($request->status === 'applicant' && $request->fee_id) {
                $fee = Fee::find($request->fee_id);
                Invoice::create([
                    'student_id' => $student->id,
                    'fee_id' => $fee->id,
                    'amount' => $fee->amount,
                    'discount' => 0.00,
                    'status' => 'unpaid',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Student onboarded successfully.',
                'student' => $student->load('user')
            ]);
        });
    }

    /**
     * Upload verification documents for a student.
     */
    public function uploadDocument(Request $request, $id)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,png|max:2048'
        ]);

        $student = Student::findOrFail($id);

        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('documents', 'public');
            $student->update([
                'document_path' => $path
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Verification document uploaded successfully.',
                'path' => $path
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }
}
