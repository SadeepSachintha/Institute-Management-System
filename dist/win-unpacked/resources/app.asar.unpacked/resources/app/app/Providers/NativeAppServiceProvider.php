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
        Window::open()
            ->width(1280)
            ->height(800)
            ->title('Institute Management System - Control Center');

        $this->startPythonMicroservice();
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
