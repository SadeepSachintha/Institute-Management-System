<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Student;

class AnalyticsController extends Controller
{
    /**
     * Fetch predictive risk assessment for a specific student.
     */
    public function getStudentRisk($studentId)
    {
        try {
            $response = Http::timeout(5)->get("http://127.0.0.1:8080/predict-risk/{$studentId}");
            
            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json([
                'error' => true,
                'message' => 'FastAPI service returned an error status: ' . $response->status()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Unable to connect to FastAPI microservice on port 8080. ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Fetch enrollment forecast indices.
     */
    public function getEnrollmentForecast()
    {
        try {
            $response = Http::timeout(5)->get("http://127.0.0.1:8080/forecast-enrollment");
            
            if ($response->successful()) {
                return response()->json($response->json());
            }
            
            return response()->json([
                'error' => true,
                'message' => 'FastAPI service returned an error status'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => 'Unable to connect to FastAPI microservice on port 8080.'
            ], 500);
        }
    }
}
