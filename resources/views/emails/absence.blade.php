<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Absence Notification</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }
        .header {
            background-color: #0f172a;
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #6366f1;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 20px;
            letter-spacing: 0.05em;
        }
        .header p {
            color: #94a3b8;
            margin: 5px 0 0 0;
            font-size: 12px;
            text-transform: uppercase;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1e293b;
            font-size: 18px;
            margin-top: 0;
        }
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .warning-title {
            font-weight: 700;
            color: #b45309;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .warning-text {
            color: #78350f;
            font-size: 13px;
            margin: 0;
            line-height: 1.5;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }
        .details-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
        }
        .details-table td.label {
            font-weight: 600;
            color: #64748b;
            width: 35%;
        }
        .details-table td.value {
            color: #0f172a;
            font-weight: 500;
        }
        .btn {
            display: inline-block;
            background-color: #6366f1;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-top: 15px;
            text-align: center;
        }
        .btn:hover {
            background-color: #4f46e5;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>IMS Central Registry</h1>
            <p>A Product of SS Labz</p>
        </div>
        <div class="content">
            <h2>Attendance Alert Notification</h2>
            <p>Dear Parent/Guardian,</p>
            <p>This is to inform you that your child was marked absent today. Please check the attendance details below:</p>
            
            <div class="warning-box">
                <div class="warning-title">Urgent Notice</div>
                <p class="warning-text">Regular attendance is crucial for academic success. If this absence is excused, please contact the registry department immediately.</p>
            </div>

            <table class="details-table">
                <tr>
                    <td class="label">Student Name</td>
                    <td class="value">{{ $studentName }}</td>
                </tr>
                <tr>
                    <td class="label">Student ID</td>
                    <td class="value">{{ $studentId }}</td>
                </tr>
                <tr>
                    <td class="label">Date</td>
                    <td class="value">{{ $date }}</td>
                </tr>
                <tr>
                    <td class="label">Subject/Class</td>
                    <td class="value">{{ $subjectName }}</td>
                </tr>
            </table>

            <div style="text-align: center;">
                <a href="https://ss-labz.pages.dev" class="btn" target="_blank">Access Portal</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} SS Labz. All rights reserved.</p>
            <p>If you have any questions, visit our site at <a href="https://ss-labz.pages.dev">ss-labz.pages.dev</a>.</p>
        </div>
    </div>
</body>
</html>
