<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use App\Models\Fee;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AuditLog;

class FinanceController extends Controller
{
    /**
     * Get financial status statistics and invoices.
     */
    public function getFinancialDashboard()
    {
        $invoices = Invoice::with(['student.user', 'fee', 'payments'])->get();
        
        $totalBilled = Invoice::sum('amount');
        $totalDiscounts = Invoice::sum('discount');
        $netBilled = $totalBilled - $totalDiscounts;
        
        $totalPaid = Payment::sum('amount_paid');
        $outstanding = $netBilled - $totalPaid;

        // Group revenue by day for visual charts
        $revenueTrend = Payment::select(
            DB::raw('DATE(payment_date) as date'),
            DB::raw('SUM(amount_paid) as revenue')
        )
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();

        $fees = Fee::all();

        return response()->json([
            'metrics' => [
                'total_billed' => round($netBilled, 2),
                'total_paid' => round($totalPaid, 2),
                'outstanding' => round(max(0, $outstanding), 2)
            ],
            'invoices' => $invoices,
            'revenue_trend' => $revenueTrend,
            'fees' => $fees
        ]);
    }

    /**
     * Process Sandbox card payment (Sandbox tuition payment portal).
     */
    public function processSandboxPayment(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount_paid' => 'required|numeric|min:1',
            'payment_method' => 'required|string',
            'card_number' => 'nullable|string|min:16', // sandbox card
        ]);

        return DB::transaction(function () use ($request) {
            $invoice = Invoice::findOrFail($request->invoice_id);
            $amountToPay = floatval($request->amount_paid);
            
            // Check current paid amount
            $alreadyPaid = $invoice->payments()->sum('amount_paid');
            $remaining = ($invoice->amount - $invoice->discount) - $alreadyPaid;

            if ($amountToPay > $remaining) {
                return response()->json([
                    'error' => true,
                    'message' => "Overpayment error: The remaining balance is \$" . number_class_format($remaining) . "."
                ], 422);
            }

            // Create payment log
            $ref = 'TXN-SANDBOX-' . strtoupper(bin2hex(random_bytes(4)));
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount_paid' => $amountToPay,
                'payment_method' => $request->payment_method,
                'transaction_reference' => $ref,
                'payment_date' => Carbon::now(),
            ]);

            try {
                \App\Models\AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'processed_payment',
                    'auditable_type' => Payment::class,
                    'auditable_id' => $payment->id,
                    'old_values' => null,
                    'new_values' => $payment->toArray(),
                    'ip_address' => $request->ip(),
                ]);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to log payment audit log: " . $e->getMessage());
            }

            // Update invoice status
            $newPaidTotal = $alreadyPaid + $amountToPay;
            $netInvoiceAmount = $invoice->amount - $invoice->discount;

            if ($newPaidTotal >= $netInvoiceAmount) {
                $invoice->update(['status' => 'paid']);
            } else {
                $invoice->update(['status' => 'partially_paid']);
            }

            // Trigger Workflow Automation!
            // If the fee invoice is paid in full, and the student is currently an "applicant" / "inquiry",
            // automatically shift their status to "enrolled" and generate their student ID!
            $workflowTriggered = false;
            $generatedId = null;
            $student = Student::with('user')->find($invoice->student_id);

            if ($invoice->status === 'paid' && in_array($student->status, ['applicant', 'inquiry'])) {
                // Generate sequential Student ID: STU-YYYY-XXXX
                $year = date('Y');
                
                // Get count of already enrolled students in the target year
                $count = Student::where('student_id', 'like', "STU-{$year}-%")
                    ->where('status', 'enrolled')
                    ->count();
                    
                $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
                $generatedId = "STU-{$year}-{$sequence}";

                // Update Student
                $student->update([
                    'status' => 'enrolled',
                    'student_id' => $generatedId
                ]);

                $workflowTriggered = true;
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully in Sandbox.',
                'payment' => $payment,
                'invoice_status' => $invoice->status,
                'workflow' => [
                    'triggered' => $workflowTriggered,
                    'status' => $student->status,
                    'student_id' => $generatedId,
                    'student_name' => $student->user->name
                ]
            ]);
        });
    }

    /**
     * Create custom fee category bill for all students of a course batch.
     */
    public function generateBatchBilling(Request $request)
    {
        $request->validate([
            'fee_id' => 'required|exists:fees,id',
            'student_ids' => 'required|array',
            'student_ids.*' => 'required|exists:students,id',
        ]);

        $fee = Fee::findOrFail($request->fee_id);
        $createdCount = 0;

        foreach ($request->student_ids as $studentId) {
            // Check if already billed for this fee
            $exists = Invoice::where('student_id', $studentId)
                ->where('fee_id', $fee->id)
                ->exists();

            if (!$exists) {
                Invoice::create([
                    'student_id' => $studentId,
                    'fee_id' => $fee->id,
                    'amount' => $fee->amount,
                    'discount' => 0.00,
                    'status' => 'unpaid'
                ]);
                $createdCount++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Successfully generated {$createdCount} invoices for this fee category."
        ]);
    }

    /**
     * Generate and download a PDF invoice.
     */
    public function downloadInvoicePdf(Request $request, $id)
    {
        $invoice = Invoice::with(['student.user', 'fee'])->findOrFail($id);

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'downloaded_invoice',
                'auditable_type' => Invoice::class,
                'auditable_id' => $invoice->id,
                'old_values' => null,
                'new_values' => [
                    'student_name' => $invoice->student->user->name,
                    'fee_category' => $invoice->fee->name,
                    'net_amount' => $invoice->amount - $invoice->discount,
                    'status' => $invoice->status
                ],
                'ip_address' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to log invoice download audit: " . $e->getMessage());
        }

        $data = [
            'invoice' => $invoice,
            'netCost' => $invoice->amount - $invoice->discount,
            'dateOfIssue' => Carbon::now()->format('F d, Y'),
        ];

        $pdf = Pdf::loadView('pdf.invoice', $data);

        return $pdf->stream("Invoice_{$invoice->id}.pdf");
    }

    /**
     * Generate and download a PDF payment receipt.
     */
    public function downloadReceiptPdf(Request $request, $id)
    {
        $payment = Payment::with(['invoice.student.user', 'invoice.fee'])->findOrFail($id);

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'downloaded_receipt',
                'auditable_type' => Payment::class,
                'auditable_id' => $payment->id,
                'old_values' => null,
                'new_values' => [
                    'student_name' => $payment->invoice->student->user->name,
                    'fee_category' => $payment->invoice->fee->name,
                    'amount_paid' => $payment->amount_paid,
                    'transaction_reference' => $payment->transaction_reference
                ],
                'ip_address' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to log receipt download audit: " . $e->getMessage());
        }

        $data = [
            'payment' => $payment,
            'dateOfIssue' => Carbon::parse($payment->payment_date)->format('F d, Y'),
        ];

        $pdf = Pdf::loadView('pdf.receipt', $data);

        return $pdf->stream("Receipt_{$payment->transaction_reference}.pdf");
    }
}

// Helper to format float values in messages
if (!function_exists('number_class_format')) {
    function number_class_format($num) {
        return number_format($num, 2);
    }
}
