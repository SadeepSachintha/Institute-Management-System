<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if (class_exists(\Laravel\Socialite\Facades\Socialite::class)) {
            \Laravel\Socialite\Facades\Socialite::extend('keycloak', function ($app) {
                $config = $app['config']['services.keycloak'];
                return \Laravel\Socialite\Facades\Socialite::buildProvider(
                    \App\Services\KeycloakProvider::class, $config
                );
            });
        }
    }
}
