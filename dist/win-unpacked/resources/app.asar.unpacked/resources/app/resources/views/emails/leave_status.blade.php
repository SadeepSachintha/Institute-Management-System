<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Leave Request Status Update</title>
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
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 15px 0;
        }
        .status-approved {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status-rejected {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
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
            <h1>IMS Human Resources</h1>
            <p>A Product of SS Labz</p>
        </div>
        <div class="content">
            <h2>Leave Request Decision</h2>
            <p>Dear {{ $facultyName }},</p>
            <p>Your leave request has been reviewed by the administration. The final decision is as follows:</p>
            
            <div style="text-align: center;">
                <span class="status-badge {{ $status === 'approved' ? 'status-approved' : 'status-rejected' }}">
                    {{ $status }}
                </span>
            </div>

            <table class="details-table">
                <tr>
                    <td class="label">Faculty Member</td>
                    <td class="value">{{ $facultyName }}</td>
                </tr>
                <tr>
                    <td class="label">Start Date</td>
                    <td class="value">{{ $startDate }}</td>
                </tr>
                <tr>
                    <td class="label">End Date</td>
                    <td class="value">{{ $endDate }}</td>
                </tr>
                <tr>
                    <td class="label">Reason Given</td>
                    <td class="value">{{ $reason }}</td>
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
