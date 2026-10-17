# Inbox Companion - Clean-Room Automated Setup & Verification Script (Windows PowerShell)
# Usage: .\scripts\setup_and_verify.ps1 [-SkipBackendDocker]

param (
    [switch]$SkipBackendDocker = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   INBOX COMPANION - CLEAN-ROOM VERIFICATION PIPELINE     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Flutter Dependency Resolution
Write-Host "`n[1/6] Resolving Flutter client dependencies..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) { throw "flutter pub get failed" }

# 2. Code Generation (Drift, Freezed, JsonSerializable)
Write-Host "`n[2/6] Running code generation (Drift SQLite, Freezed, JsonSerializable)..." -ForegroundColor Yellow
dart run build_runner build --delete-conflicting-outputs
if ($LASTEXITCODE -ne 0) { throw "build_runner failed" }

# 3. Formatting & Static Analysis
Write-Host "`n[3/6] Running formatting and analyzer gates..." -ForegroundColor Yellow
dart format --output=none --set-exit-if-changed .
if ($LASTEXITCODE -ne 0) { throw "dart format detected unformatted files" }

flutter analyze --fatal-infos --fatal-warnings
if ($LASTEXITCODE -ne 0) { throw "flutter analyze detected warnings or errors" }

# 4. Flutter Unit, Widget & Golden Tests
Write-Host "`n[4/6] Executing all Flutter unit, widget, and architecture tests..." -ForegroundColor Yellow
flutter test
if ($LASTEXITCODE -ne 0) { throw "flutter test failed" }

# 5. Backend Dependency Install, Linter, Typecheck & Tests
Write-Host "`n[5/6] Auditing Backend Monolith (NestJS / TypeScript)..." -ForegroundColor Yellow
Push-Location server
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Backend npm install failed" }

    npm run lint
    if ($LASTEXITCODE -ne 0) { throw "Backend ESLint failed" }

    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Backend TypeScript typecheck failed" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Backend nest build failed" }

    npm test
    if ($LASTEXITCODE -ne 0) { throw "Backend unit tests failed" }

    npm run test:integration
    if ($LASTEXITCODE -ne 0) { throw "Backend integration tests failed" }

    if (-not $SkipBackendDocker) {
        Write-Host "`n[Optional] Checking Docker daemon status..." -ForegroundColor Yellow
        $dockerRunning = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker daemon is active. Running database migrations & seed..." -ForegroundColor Green
            docker compose up -d postgres redis
            npm run migrate
            npm run seed
        } else {
            Write-Host "Docker daemon not running; skipped local container startup. (Use --SkipBackendDocker to suppress)" -ForegroundColor DarkYellow
        }
    }
}
finally {
    Pop-Location
}

# 6. Android SDK / Platform Toolchain Check
Write-Host "`n[6/6] Checking platform build toolchains..." -ForegroundColor Yellow
if ($env:ANDROID_HOME -or (Get-Command "adb" -ErrorAction SilentlyContinue)) {
    Write-Host "Android SDK detected. Running android debug build test..." -ForegroundColor Green
    flutter build apk --debug -t lib/main_dev.dart
} else {
    Write-Host "NOTE: Android SDK not configured on this host. Skipping physical APK compile." -ForegroundColor DarkYellow
    Write-Host "For desktop execution on Windows, enable Windows Developer Mode in Settings." -ForegroundColor DarkYellow
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   CLEAN-ROOM SETUP & VERIFICATION COMPLETED SUCCESSFULLY   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
