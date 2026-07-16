<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SSOController extends Controller
{
    public function redirectToProvider()
    {
        if (empty(config('services.keycloak.base_url'))) {
            // Mock Mode: Redirect to our internal mock keycloak endpoint
            return redirect()->route('auth.sso.mock');
        }

        return Socialite::driver('keycloak')->redirect();
    }

    public function handleProviderCallback()
    {
        try {
            $socialUser = Socialite::driver('keycloak')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors(['sso' => 'SSO authentication failed: ' . $e->getMessage()]);
        }

        return $this->loginOrRegisterSocialUser($socialUser->getName() ?? $socialUser->getNickname(), $socialUser->getEmail());
    }

    public function handleMockLogin()
    {
        // Simulate a successful callback from OAuth with mock data
        return $this->loginOrRegisterSocialUser('OAuth Student', 'oauth_student@ims.com');
    }

    protected function loginOrRegisterSocialUser($name, $email)
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            $user = User::create([
                'name' => $name ?? 'SSO User',
                'email' => $email,
                'password' => bcrypt(Str::random(16)),
                'role' => 'student',
            ]);
        }

        // Ensure Spatie role is assigned if roles are seeded
        try {
            if (class_exists(\Spatie\Permission\Models\Role::class)) {
                $roleExists = \Spatie\Permission\Models\Role::where('name', $user->role)->exists();
                if ($roleExists) {
                    $user->assignRole($user->role);
                }
            }
        } catch (\Exception $e) {
            // Role table might not be seeded yet
        }

        auth()->login($user, true);

        return redirect()->intended(route('dashboard'));
    }
}
