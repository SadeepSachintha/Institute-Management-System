Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "IMS Core - Industrial Production Build Pipeline" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Clear caches
Write-Host "[1/5] Clearing application caches..." -ForegroundColor Yellow
& "./php.bat" artisan config:clear
& "./php.bat" artisan route:clear
& "./php.bat" artisan view:clear
& "./php.bat" artisan cache:clear

# 2. Cleanup developer logs and temporary state files
Write-Host "[2/5] Cleaning developer temporary files and logs..." -ForegroundColor Yellow
$logFile = "storage/logs/laravel.log"
if (Test-Path $logFile) {
    Remove-Item $logFile
    Write-Host "Cleared $logFile" -ForegroundColor Gray
}
$seedFlag = "storage/app/db_seeded.txt"
if (Test-Path $seedFlag) {
    Remove-Item $seedFlag
    Write-Host "Removed $seedFlag to force first-install seeding on client machines" -ForegroundColor Gray
}

# 3. Optimize PHP Composer dependencies
Write-Host "[3/5] Installing optimized production Composer autoloader..." -ForegroundColor Yellow
& "./composer.bat" install --no-dev --optimize-autoloader --prefer-dist --no-interaction --ignore-platform-reqs

# 4. Compile frontend assets freshly and deterministically
Write-Host "[4/5] Compiling production frontend assets deterministically..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    & "npm.cmd" ci
} else {
    & "npm.cmd" install
}
& "npm.cmd" run build

# 5. Run NativePHP Electron packaging
Write-Host "[5/5] Packaging standalone desktop application with Electron..." -ForegroundColor Yellow
if (Test-Path "public/storage") {
    Remove-Item "public/storage" -Force -Recurse -ErrorAction SilentlyContinue
}
& "./php.bat" artisan native:build win x64 --no-interaction
& "./php.bat" artisan storage:link

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Build complete! Check the 'dist/' directory for installer packages." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
