<?php

namespace App\Providers;

use Native\Laravel\Facades\Window;
use Native\Laravel\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        $this->ensureDatabaseIsSeeded();

        Window::open()
            ->width(1280)
            ->height(800)
            ->title('Institute Management System - Control Center');

        $this->startPythonMicroservice();
    }

    /**
     * Ensure that the SQLite database is created, migrated, and seeded with default data.
     */
    protected function ensureDatabaseIsSeeded(): void
    {
        if (config('nativephp-internal.running')) {
            $flagFile = storage_path('app/db_seeded.txt');

            if (!file_exists($flagFile)) {
                try {
                    $dbPath = config('nativephp-internal.database_path');
                    if ($dbPath) {
                        $dir = dirname($dbPath);
                        if (!is_dir($dir)) {
                            mkdir($dir, 0755, true);
                        }
                        if (!file_exists($dbPath)) {
                            touch($dbPath);
                        }
                    }

                    // Run migrations
                    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

                    // Check if users table exists and is empty, then seed
                    if (\Illuminate\Support\Facades\Schema::hasTable('users')) {
                        $usersCount = \Illuminate\Support\Facades\DB::table('users')->count();
                        if ($usersCount === 0) {
                            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
                        }
                    }

                    // Create the flag file to avoid running this on subsequent requests
                    file_put_contents($flagFile, 'seeded_at=' . date('Y-m-d H:i:s'));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::error('NativePHP database auto-seed failed: ' . $e->getMessage(), [
                        'exception' => $e
                    ]);
                }
            }
        }
    }

    /**
     * Start the Python early warning analytics microservice portably in the background.
     */
    protected function startPythonMicroservice(): void
    {
        $pythonPath = base_path('analytics/.venv/Scripts/python.exe');
        if (!file_exists($pythonPath)) {
            $pythonPath = base_path('analytics/.venv/bin/python');
        }

        if (file_exists($pythonPath)) {
            // Set SQLite environment variables for Python sidecar process to inherit
            putenv("DB_CONNECTION=sqlite");
            if (config('nativephp-internal.running')) {
                putenv("DB_DATABASE=" . config('nativephp-internal.database_path'));
            } else {
                putenv("DB_DATABASE=" . database_path('nativephp.sqlite'));
            }

            if (PHP_OS_FAMILY === 'Windows') {
                $command = "start /B \"\" \"{$pythonPath}\" -m uvicorn main:app --host 127.0.0.1 --port 8080 --app-dir \"" . base_path('analytics') . "\"";
                pclose(popen($command, "r"));
            } else {
                $command = "nohup \"{$pythonPath}\" -m uvicorn main:app --host 127.0.0.1 --port 8080 --app-dir \"" . base_path('analytics') . "\" > /dev/null 2>&1 &";
                exec($command);
            }
        }
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
        ];
    }
}
