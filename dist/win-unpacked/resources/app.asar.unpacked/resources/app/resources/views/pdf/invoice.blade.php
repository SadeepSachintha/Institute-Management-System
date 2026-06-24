<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->id }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .header-logo {
            width: 60px;
            vertical-align: middle;
        }
        .header-title-box {
            padding-left: 15px;
            vertical-align: middle;
        }
        .header-title {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .header-subtitle {
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 3px 0 0 0;
        }
        .header-right {
            text-align: right;
            vertical-align: middle;
        }
        .status-badge {
            display: inline-block;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 12px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .status-unpaid {
            background-color: #fef2f2;
            color: #dc2626;
            border: 1px solid #fee2e2;
        }
        .status-paid {
            background-color: #f0fdf4;
            color: #16a34a;
            border: 1px solid #dcfce7;
        }
        .status-partially-paid {
            background-color: #fffbeb;
            color: #d97706;
            border: 1px solid #fef3c7;
        }
        .divider {
            border-top: 3px solid #6366f1;
            margin-bottom: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .info-table td {
            padding: 10px 15px;
            border: 1px solid #e2e8f0;
            width: 25%;
        }
        .info-label {
            font-weight: bold;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
        }
        .info-value {
            color: #0f172a;
            font-weight: 500;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .items-table tr.total-row {
            background-color: #f8fafc;
            font-weight: bold;
        }
        .items-table tr.total-row td {
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 60px;
        }
        .signature-box {
            width: 45%;
            text-align: center;
            vertical-align: bottom;
        }
        .signature-line {
            border-top: 1px solid #cbd5e1;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 12px;
            font-weight: 500;
            color: #334155;
        }
        .signature-title {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }
        .logo-svg {
            fill: #6366f1;
        }
    </style>
</head>
<body>
    <!-- Top Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                <svg width="45" height="45" viewBox="0 0 24 24" class="logo-svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#6366f1" stroke-width="2" fill="none"/>
                </svg>
            </td>
            <td class="header-title-box">
                <h1 class="header-title">{{ \App\Models\Setting::get('institution_name', 'INSTITUTE CONTROL CENTER') }}</h1>
                <p class="header-subtitle">Official Finance & Accounts Office &bull; {{ \App\Models\Setting::get('domain_url', 'localhost:8000') }}</p>
            </td>
            <td class="header-right">
                <span class="status-badge 
                    @if($invoice->status === 'paid') status-paid
                    @elseif($invoice->status === 'partially_paid') status-partially-paid
                    @else status-unpaid @endif">
                    {{ str_replace('_', ' ', $invoice->status) }}
                </span>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- Metadata Details -->
    <table class="info-table">
        <tr>
            <td class="info-label">Billed To (Student)</td>
            <td class="info-value">{{ $invoice->student->user->name }}</td>
            <td class="info-label">Invoice ID</td>
            <td class="info-value font-mono">INV-{{ str_pad($invoice->id, 6, '0', STR_PAD_LEFT) }}</td>
        </tr>
        <tr>
            <td class="info-label">Student ID</td>
            <td class="info-value font-mono">{{ $invoice->student->student_id }}</td>
            <td class="info-label">Date of Issue</td>
            <td class="info-value">{{ $dateOfIssue }}</td>
        </tr>
        <tr>
            <td class="info-label">Program of Study</td>
            <td class="info-value">
                @if($invoice->student->batches->isNotEmpty() && $invoice->student->batches->first()->course)
                    {{ $invoice->student->batches->first()->course->name }}
                @else
                    N/A
                @endif
            </td>
            <td class="info-label">Payment Method</td>
            <td class="info-value">Simulated Sandbox</td>
        </tr>
    </table>

    <!-- Items Marksheet Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th>Item Description / Fee Category</th>
                <th style="text-align: right;">Gross Price</th>
                <th style="text-align: right;">Scholarship Discount</th>
                <th style="text-align: right;">Net Payable</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight: 500; color: #0f172a;">
                    {{ $invoice->fee->name }}
                    <span style="display: block; font-size: 10px; color: #64748b; font-weight: normal; margin-top: 4px;">
                        Term academic billing and operations fee coverage.
                    </span>
                </td>
                <td style="text-align: right; font-family: monospace;">${{ number_format($invoice->amount, 2) }}</td>
                <td style="text-align: right; font-family: monospace; color: #dc2626;">-${{ number_format($invoice->discount, 2) }}</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #0f172a;">${{ number_format($netCost, 2) }}</td>
            </tr>
            
            <!-- Total summary blocks -->
            <tr class="total-row">
                <td colspan="3" style="text-align: right; font-size: 11px; text-transform: uppercase; color: #64748b;">Grand Total Billed</td>
                <td style="text-align: right; font-family: monospace; font-size: 14px; color: #6366f1;">${{ number_format($netCost, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <!-- Signature Areas -->
    <table class="signatures-table">
        <tr>
            <td class="signature-box">
                <div class="signature-line font-mono" style="font-size: 11px; color: #94a3b8; font-style: italic; border-top: none;">[Finance Authorized Stamp]</div>
                <div class="signature-line">Chief Accounts Officer</div>
                <div class="signature-title">Finance & Invoicing Department</div>
            </td>
            <td style="width: 10%;"></td>
            <td class="signature-box">
                <div class="signature-line font-mono" style="font-size: 11px; color: #94a3b8; font-style: italic; border-top: none;">[Registrar Verified Sign]</div>
                <div class="signature-line">Registrar of Registry Office</div>
                <div class="signature-title">Official Registry & Records</div>
            </td>
        </tr>
    </table>
</body>
</html>
