<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Fee;
use App\Models\Invoice;
use Illuminate\Support\Facades\Log;

class GenerateStudentBilling implements ShouldQueue
{
    use Queueable, Dispatchable, InteractsWithQueue, SerializesModels;

    protected $feeId;
    protected $studentIds;

    public function __construct(int $feeId, array $studentIds)
    {
        $this->feeId = $feeId;
        $this->studentIds = $studentIds;
    }

    public function handle(): void
    {
        $fee = Fee::find($this->feeId);
        if (!$fee) {
            return;
        }

        $createdCount = 0;
        Log::info("Starting batch invoice generation for Fee ID: {$fee->id} across " . count($this->studentIds) . " students.");

        foreach ($this->studentIds as $studentId) {
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

        Log::info("Successfully generated {$createdCount} invoices for Fee Category: {$fee->name} asynchronously.");
    }
}
