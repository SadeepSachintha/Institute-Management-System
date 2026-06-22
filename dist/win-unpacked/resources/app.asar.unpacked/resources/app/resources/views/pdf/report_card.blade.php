<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report Card - {{ $student->student_id }}</title>
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
        .report-badge {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 12px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .divider {
            border-top: 3px solid #4f46e5;
            margin-bottom: 20px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
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
        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .grades-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: bold;
            text-align: left;
            padding: 10px 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .grades-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .grades-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .grades-table tr.total-row {
            background-color: #f1f5f9;
            font-weight: bold;
        }
        .grades-table tr.total-row td {
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .badge-grade {
            display: inline-block;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
        }
        .badge-a { color: #16a34a; }
        .badge-b { color: #2563eb; }
        .badge-c { color: #d97706; }
        .badge-f { color: #dc2626; }
        
        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            text-align: center;
            background-color: #ffffff;
            width: 30%;
        }
        .summary-title {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .summary-value {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
        }
        .summary-spacer {
            width: 5%;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 50px;
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
            fill: #4f46e5;
        }
    </style>
</head>
<body>
    <!-- Top Header -->
    <table class="header-table">
        <tr>
            <td class="header-logo">
                <svg width="45" height="45" viewBox="0 0 24 24" class="logo-svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#4f46e5" stroke-width="2" fill="none"/>
                </svg>
            </td>
            <td class="header-title-box">
                <h1 class="header-title">{{ \App\Models\Setting::get('institution_name', 'SS LABZ INSTITUTE') }}</h1>
                <p class="header-subtitle">Official Academic Registry &bull; {{ \App\Models\Setting::get('domain_url', 'ss-labz.pages.dev') }}</p>
            </td>
            <td class="header-right">
                <span class="report-badge">Official Report Card</span>
            </td>
        </tr>
    </table>

    <div class="divider"></div>

    <!-- Student Metadata -->
    <table class="info-table">
        <tr>
            <td class="info-label">Student Name</td>
            <td class="info-value">{{ $student->user->name }}</td>
            <td class="info-label">Date of Issue</td>
            <td class="info-value">{{ $dateOfIssue }}</td>
        </tr>
        <tr>
            <td class="info-label">Student ID</td>
            <td class="info-value font-mono">{{ $student->student_id }}</td>
            <td class="info-label">Academic Program</td>
            <td class="info-value">
                @if($student->batches->isNotEmpty() && $student->batches->first()->course)
                    {{ $student->batches->first()->course->name }}
                @else
                    N/A
                @endif
            </td>
        </tr>
        <tr>
            <td class="info-label">Student Email</td>
            <td class="info-value">{{ $student->user->email }}</td>
            <td class="info-label">Batch Cohort</td>
            <td class="info-value">
                @if($student->batches->isNotEmpty())
                    {{ $student->batches->first()->name }}
                @else
                    N/A
                @endif
            </td>
        </tr>
    </table>

    <!-- Grades Marksheet -->
    <table class="grades-table">
        <thead>
            <tr>
                <th>Subject Course</th>
                <th>Assessment Item</th>
                <th>Weight</th>
                <th>Marks Obtained</th>
                <th>Maximum Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
            </tr>
        </thead>
        <tbody>
            @foreach($subjectGrades as $grade)
                <tr>
                    <td style="font-weight: 500; color: #0f172a;">{{ $grade['subject_name'] }}</td>
                    <td>{{ $grade['assessment_name'] }}</td>
                    <td>{{ number_format($grade['weight'] * 100, 0) }}%</td>
                    <td style="font-family: monospace;">{{ $grade['marks_obtained'] }}</td>
                    <td style="font-family: monospace;">{{ $grade['max_marks'] }}</td>
                    <td style="font-family: monospace; font-weight: 500;">{{ $grade['percentage'] }}%</td>
                    <td>
                        <span class="badge-grade 
                            @if(strpos($grade['letter_grade'], 'A') !== false) badge-a
                            @elseif(strpos($grade['letter_grade'], 'B') !== false) badge-b
                            @elseif(strpos($grade['letter_grade'], 'C') !== false) badge-c
                            @else badge-f @endif">
                            {{ $grade['letter_grade'] }}
                        </span>
                    </td>
                </tr>
            @endforeach
            @if(empty($subjectGrades))
                <tr>
                    <td colSpan="7" style="text-align: center; color: #64748b; padding: 20px 0;">No graded assessment items recorded for this student.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Summary Box -->
    <table class="summary-table">
        <tr>
            <td class="summary-card">
                <div class="summary-title">Cumulative Average</div>
                <div class="summary-value">{{ $overallAverage }}%</div>
            </td>
            <td class="summary-spacer"></td>
            <td class="summary-card">
                <div class="summary-title">Weighted GPA</div>
                <div class="summary-value" style="color: #4f46e5;">{{ $finalGPA }} / 4.00</div>
            </td>
            <td class="summary-spacer"></td>
            <td class="summary-card">
                <div class="summary-title">Batch Class Rank</div>
                <div class="summary-value">{{ $classRank }}</div>
            </td>
        </tr>
    </table>

    <!-- Signatures -->
    <table class="signatures-table">
        <tr>
            <td class="signature-box">
                <div class="signature-line font-mono" style="font-size: 11px; color: #94a3b8; font-style: italic; border-top: none;">[Registrar Digital Stamp]</div>
                <div class="signature-line">Registrar of Registry Office</div>
                <div class="signature-title">Registry & Operations</div>
            </td>
            <td style="width: 10%;"></td>
            <td class="signature-box">
                <div class="signature-line font-mono" style="font-size: 11px; color: #94a3b8; font-style: italic; border-top: none;">[Dean Authorized Sign]</div>
                <div class="signature-line">Dean of Academic Affairs</div>
                <div class="signature-title">{{ \App\Models\Setting::get('institution_name', 'SS Labz') }} Academics</div>
            </td>
        </tr>
    </table>
</body>
</html>
