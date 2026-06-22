<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditController extends Controller
{
    /**
     * Get recent system audit logs.
     */
    public function index()
    {
        $logs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
            
        return response()->json($logs);
    }
}
