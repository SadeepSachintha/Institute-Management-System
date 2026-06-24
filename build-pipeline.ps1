Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "IMS Core - Industrial Production Build Pipeline" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Clear caches
Write-Host "[1/4] Clearing application caches..." -ForegroundColor Yellow
& "./php.bat" artisan config:clear
& "./php.bat" artisan route:clear
& "./php.bat" artisan view:clear
& "./php.bat" artisan cache:clear

# 2. Build frontend assets
Write-Host "[2/4] Compiling fresh production frontend assets..." -ForegroundColor Yellow
& "npm.cmd" run build

# 3. Clean up log files
Write-Host "[3/4] Cleaning developer log files..." -ForegroundColor Yellow
$logFile = "storage/logs/laravel.log"
if (Test-Path $logFile) {
    Remove-Item $logFile
    Write-Host "Cleared $logFile" -ForegroundColor Gray
}

# 4. Run NativePHP packager
Write-Host "[4/4] Bundling NativePHP standalone desktop application..." -ForegroundColor Yellow
& "./php.bat" artisan native:build win x64 --no-interaction

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Build complete! Check the 'dist/' directory for installer packages." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
