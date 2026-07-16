<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class TelemetryMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        // Enable query log
        DB::connection()->enableQueryLog();

        $response = $next($request);

        $endTime = microtime(true);
        $endMemory = memory_get_usage();

        $duration = round(($endTime - $startTime) * 1000, 2); // duration in milliseconds
        $memoryUsed = round(($endMemory - $startMemory) / 1024 / 1024, 4); // MB
        $queries = DB::connection()->getQueryLog();
        $queryCount = count($queries);
        $queryTime = array_sum(array_column($queries, 'time'));

        // Generate OpenTelemetry compliant JSON structure
        $telemetryData = [
            'timestamp' => now()->toIso8601String(),
            'trace_id' => bin2hex(random_bytes(16)), // Mock Trace ID
            'span_id' => bin2hex(random_bytes(8)),   // Mock Span ID
            'service_name' => 'ims-core-app',
            'http' => [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status_code' => $response->getStatusCode(),
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
            ],
            'performance' => [
                'duration_ms' => $duration,
                'memory_used_mb' => $memoryUsed,
                'db_queries_count' => $queryCount,
                'db_queries_time_ms' => $queryTime,
            ],
        ];

        // Write structured telemetry entry to log
        Log::channel('telemetry')->info(json_encode($telemetryData));

        return $response;
    }
}
