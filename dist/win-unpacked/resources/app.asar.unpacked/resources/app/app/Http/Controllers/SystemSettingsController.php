<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class SystemSettingsController extends Controller
{
    /**
     * Fetch settings list.
     */
    public function getSettings()
    {
        return response()->json([
            'institution_name' => Setting::get('institution_name', 'INSTITUTE CONTROL CENTER'),
            'logo_url' => Setting::get('logo_url', ''),
            'domain_url' => Setting::get('domain_url', 'localhost:8000'),
            'grade_threshold_a_plus' => floatval(Setting::get('grade_threshold_a_plus', 90)),
            'grade_threshold_a' => floatval(Setting::get('grade_threshold_a', 80)),
            'grade_threshold_b' => floatval(Setting::get('grade_threshold_b', 70)),
            'grade_threshold_c' => floatval(Setting::get('grade_threshold_c', 60)),
        ]);
    }

    /**
     * Save settings batch.
     */
    public function saveSettings(Request $request)
    {
        $request->validate([
            'institution_name' => 'required|string|max:100',
            'logo_url' => 'nullable|string|max:500',
            'domain_url' => 'required|string|max:100',
            'grade_threshold_a_plus' => 'required|numeric|min:0|max:100',
            'grade_threshold_a' => 'required|numeric|min:0|max:100',
            'grade_threshold_b' => 'required|numeric|min:0|max:100',
            'grade_threshold_c' => 'required|numeric|min:0|max:100',
        ]);

        $oldValues = [
            'institution_name' => Setting::get('institution_name', 'INSTITUTE CONTROL CENTER'),
            'logo_url' => Setting::get('logo_url', ''),
            'domain_url' => Setting::get('domain_url', 'localhost:8000'),
            'grade_threshold_a_plus' => Setting::get('grade_threshold_a_plus', 90),
            'grade_threshold_a' => Setting::get('grade_threshold_a', 80),
            'grade_threshold_b' => Setting::get('grade_threshold_b', 70),
            'grade_threshold_c' => Setting::get('grade_threshold_c', 60),
        ];

        $newValues = $request->only([
            'institution_name', 'logo_url', 'domain_url',
            'grade_threshold_a_plus', 'grade_threshold_a',
            'grade_threshold_b', 'grade_threshold_c'
        ]);

        foreach ($newValues as $key => $val) {
            Setting::set($key, strval($val));
        }

        try {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'updated_settings',
                'auditable_type' => Setting::class,
                'auditable_id' => 0,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $request->ip(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to log settings update audit: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'System settings and institutional branding updated successfully.',
            'settings' => $newValues
        ]);
    }
}
