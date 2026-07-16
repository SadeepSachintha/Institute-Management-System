<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Stripe\Webhook;
use Stripe\Event;

class WebhookController extends Controller
{
    public function handleStripe(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = env('STRIPE_WEBHOOK_SECRET');
        $event = null;

        try {
            if ($endpointSecret && $sigHeader) {
                $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);
            } else {
                // Fallback for testing/local simulator
                $data = json_decode($payload, true);
                $event = json_decode(json_encode([
                    'type' => $data['type'] ?? 'checkout.session.completed',
                    'data' => [
                        'object' => $data['data']['object'] ?? $data
                    ]
                ]));
            }
        } catch (\UnexpectedValueException $e) {
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        Log::info("Stripe Webhook Event Received: " . ($event->type ?? 'unknown'));

        if (($event->type ?? '') === 'checkout.session.completed') {
            $session = $event->data->object;
            $invoiceId = $session->metadata->invoice_id ?? null;
            $amountPaid = ($session->amount_total ?? 0) / 100; // Stripe uses cents
            $ref = $session->id ?? 'STRIPE-' . strtoupper(bin2hex(random_bytes(4)));

            if ($invoiceId) {
                $this->processPaidInvoice($invoiceId, $amountPaid, $ref);
            }
        }

        return response()->json(['success' => true]);
    }

    protected function processPaidInvoice($invoiceId, $amountPaid, $transactionRef)
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($invoiceId, $amountPaid, $transactionRef) {
            $invoice = Invoice::findOrFail($invoiceId);
            
            // Create payment record
            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'amount_paid' => $amountPaid,
                'payment_method' => 'Stripe Checkout',
                'transaction_reference' => $transactionRef,
                'payment_date' => Carbon::now(),
            ]);

            Log::info("Payment of \${$amountPaid} recorded for Invoice ID: {$invoice->id} via Stripe webhook.");

            // Update Invoice Status
            $alreadyPaid = $invoice->payments()->where('id', '!=', $payment->id)->sum('amount_paid');
            $newPaidTotal = $alreadyPaid + $amountPaid;
            $netInvoiceAmount = $invoice->amount - $invoice->discount;

            if ($newPaidTotal >= $netInvoiceAmount) {
                $invoice->update(['status' => 'paid']);
            } else {
                $invoice->update(['status' => 'partially_paid']);
            }

            // Student Status Upgrade Automation
            $student = Student::with('user')->find($invoice->student_id);
            if ($invoice->status === 'paid' && in_array($student->status, ['applicant', 'inquiry'])) {
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

                Log::info("Workflow Automation triggered: Onboarded student {$student->user->name} with Assigned ID: {$generatedId}");
            }
        });
    }
}
