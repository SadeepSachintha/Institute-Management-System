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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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

        // Dispatches the billing generation asynchronously to background queue
        \App\Jobs\GenerateStudentBilling::dispatch(
            intval($request->fee_id), 
            $request->student_ids
        );

        return response()->json([
            'success' => true,
            'message' => "Batch invoice generation has been queued in the background."
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

    /**
     * Generate Stripe Checkout Session.
     */
    public function createStripeSession(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
        ]);

        $invoice = Invoice::with(['student.user', 'fee'])->findOrFail($request->invoice_id);
        $netAmount = ($invoice->amount - $invoice->discount);

        if ($netAmount <= 0) {
            return response()->json(['error' => 'Invoice has no outstanding balance'], 400);
        }

        // Initialize Stripe SDK
        \Stripe\Stripe::setApiKey(env('STRIPE_SECRET') ?? 'sk_test_mock_stripe_key_placeholder_for_local_env');

        try {
            $session = \Stripe\Checkout\Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => "IMS Tuition Fee: {$invoice->fee->name}",
                            'description' => "Invoice #{$invoice->id} for {$invoice->student->user->name}",
                        ],
                        'unit_amount' => $netAmount * 100, // Stripe expects cents
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => url('/dashboard?payment=success&invoice=' . $invoice->id),
                'cancel_url' => url('/dashboard?payment=cancelled'),
                'metadata' => [
                    'invoice_id' => $invoice->id,
                ],
            ]);

            return response()->json([
                'success' => true,
                'checkout_url' => $session->url,
            ]);
        } catch (\Exception $e) {
            // Local fallback simulation if Stripe credentials are blank
            if (empty(env('STRIPE_SECRET'))) {
                Log::info("Mock Stripe key used. Simulating success url redirection locally.");
                // Return a mock checkout URL that points back to a simulator route or local success route
                $mockSessionUrl = url('/api/finance/pay/mock-stripe-callback?invoice_id=' . $invoice->id . '&amount=' . $netAmount);
                return response()->json([
                    'success' => true,
                    'checkout_url' => $mockSessionUrl,
                ]);
            }
            return response()->json(['error' => 'Stripe Session generation failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Local Stripe webhook simulator endpoint.
     */
    public function mockStripeCallback(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric',
        ]);

        $invoiceId = $request->invoice_id;
        $amount = $request->amount;
        
        $webhookUrl = route('stripe.webhook');
        
        $payload = [
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_mock_' . Str::random(10),
                    'amount_total' => $amount * 100,
                    'metadata' => [
                        'invoice_id' => $invoiceId
                    ]
                ]
            ]
        ];

        // Send a post request internally to our webhook controller
        $client = new \GuzzleHttp\Client();
        try {
            $client->post($webhookUrl, [
                'json' => $payload
            ]);
        } catch (\Exception $e) {
            Log::error("Mock webhook POST failed: " . $e->getMessage());
        }

        return redirect('/dashboard?payment=success&invoice=' . $invoiceId);
    }

    /**
     * Upload Bank deposit receipt slip.
     */
    public function uploadSlip(Request $request, $id)
    {
        $request->validate([
            'slip' => 'required|file|mimes:jpeg,png,jpg,pdf|max:4096',
        ]);

        $invoice = Invoice::findOrFail($id);

        if ($invoice->status === 'paid') {
            return response()->json(['error' => 'Invoice is already paid'], 400);
        }

        if ($request->hasFile('slip')) {
            $path = $request->file('slip')->store('slips', 'public');
            
            $invoice->update([
                'slip_path' => '/storage/' . $path,
                'status' => 'pending_verification'
            ]);

            try {
                \App\Models\AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'uploaded_bank_slip',
                    'auditable_type' => Invoice::class,
                    'auditable_id' => $invoice->id,
                    'old_values' => null,
                    'new_values' => ['slip_path' => $invoice->slip_path],
                    'ip_address' => $request->ip(),
                ]);
            } catch (\Exception $e) {
                Log::error("Failed to log bank slip upload audit: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Bank deposit slip uploaded successfully. Pending administrator verification.',
                'invoice' => $invoice
            ]);
        }

        return response()->json(['error' => 'No file uploaded'], 400);
    }

    /**
     * Approve or reject a pending bank deposit slip.
     */
    public function verifySlip(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:approve,reject',
            'remarks' => 'nullable|string|max:255'
        ]);

        return DB::transaction(function () use ($request, $id) {
            $invoice = Invoice::findOrFail($id);

            if ($invoice->status !== 'pending_verification') {
                return response()->json(['error' => 'Invoice has no pending verification slip'], 400);
            }

            $action = $request->status;

            if ($action === 'approve') {
                $netAmount = $invoice->amount - $invoice->discount;
                
                $ref = 'TXN-BANK-' . strtoupper(bin2hex(random_bytes(4)));
                $payment = Payment::create([
                    'invoice_id' => $invoice->id,
                    'amount_paid' => $netAmount,
                    'payment_method' => 'Bank Transfer',
                    'transaction_reference' => $ref,
                    'payment_date' => Carbon::now(),
                ]);

                $invoice->update([
                    'status' => 'paid'
                ]);

                $student = Student::with('user')->find($invoice->student_id);
                $workflowTriggered = false;
                $generatedId = null;

                if (in_array($student->status, ['applicant', 'inquiry'])) {
                    $year = date('Y');
                    $count = Student::where('student_id', 'like', "STU-{$year}-%")
                        ->where('status', 'enrolled')
                        ->count();
                        
                    $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
                    $generatedId = "STU-{$year}-{$sequence}";

                    $student->update([
                        'status' => 'enrolled',
                        'student_id' => $generatedId
                    ]);

                    $workflowTriggered = true;
                }

                try {
                    \App\Models\AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'approved_bank_slip',
                        'auditable_type' => Invoice::class,
                        'auditable_id' => $invoice->id,
                        'old_values' => ['status' => 'pending_verification'],
                        'new_values' => ['status' => 'paid', 'payment_id' => $payment->id],
                        'ip_address' => $request->ip(),
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to log bank slip approval audit: " . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Bank slip approved successfully. Invoice marked as paid.',
                    'invoice' => $invoice,
                    'workflow' => [
                        'triggered' => $workflowTriggered,
                        'status' => $student->status,
                        'student_id' => $generatedId,
                        'student_name' => $student->user->name
                    ]
                ]);

            } else {
                $oldSlip = $invoice->slip_path;
                $invoice->update([
                    'status' => 'unpaid',
                    'slip_path' => null
                ]);

                try {
                    \App\Models\AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'rejected_bank_slip',
                        'auditable_type' => Invoice::class,
                        'auditable_id' => $invoice->id,
                        'old_values' => ['status' => 'pending_verification', 'slip_path' => $oldSlip],
                        'new_values' => ['status' => 'unpaid', 'remarks' => $request->remarks],
                        'ip_address' => $request->ip(),
                    ]);
                } catch (\Exception $e) {
                    Log::error("Failed to log bank slip rejection audit: " . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Bank slip rejected. Invoice status returned to unpaid.',
                    'invoice' => $invoice
                ]);
            }
        });
    }
}

// Helper to format float values in messages
if (!function_exists('number_class_format')) {
    function number_class_format($num) {
        return number_format($num, 2);
    }
}
