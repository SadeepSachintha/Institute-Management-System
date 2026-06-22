<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'settings' => [
                'institution_name' => \App\Models\Setting::get('institution_name', 'SS LABZ INSTITUTE'),
                'logo_url' => \App\Models\Setting::get('logo_url', ''),
                'domain_url' => \App\Models\Setting::get('domain_url', 'ss-labz.pages.dev'),
                'grade_threshold_a_plus' => (float)\App\Models\Setting::get('grade_threshold_a_plus', 90),
                'grade_threshold_a' => (float)\App\Models\Setting::get('grade_threshold_a', 80),
                'grade_threshold_b' => (float)\App\Models\Setting::get('grade_threshold_b', 70),
                'grade_threshold_c' => (float)\App\Models\Setting::get('grade_threshold_c', 60),
            ],
        ];
    }
}
