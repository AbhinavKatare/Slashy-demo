#!/usr/bin/env bash
# Inbox Companion - Clean-Room Automated Setup & Verification Script (POSIX / Bash)
set -euo pipefail

echo "=========================================================="
echo "   INBOX COMPANION - CLEAN-ROOM VERIFICATION PIPELINE     "
echo "=========================================================="

echo -e "\n[1/6] Resolving Flutter client dependencies..."
flutter pub get

echo -e "\n[2/6] Running code generation (Drift SQLite, Freezed, JsonSerializable)..."
dart run build_runner build --delete-conflicting-outputs

echo -e "\n[3/6] Running formatting and analyzer gates..."
dart format --output=none --set-exit-if-changed .
flutter analyze --fatal-infos --fatal-warnings

echo -e "\n[4/6] Executing all Flutter unit, widget, and architecture tests..."
flutter test

echo -e "\n[5/6] Auditing Backend Monolith (NestJS / TypeScript)..."
cd server
npm install
npm run lint
npm run typecheck
npm run build
npm test
npm run test:integration

if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "Docker daemon active. Launching Postgres & running migrations..."
    docker compose up -d postgres redis
    npm run migrate
    npm run seed
else
    echo "Docker not running or not found. Skipping docker compose up & migration run."
fi
cd ..

echo -e "\n[6/6] Checking platform build toolchains..."
if [ -n "${ANDROID_HOME:-}" ] || command -v adb &> /dev/null; then
    echo "Android SDK detected. Running android debug build test..."
    flutter build apk --debug -t lib/main_dev.dart
else
    echo "NOTE: Android SDK not configured in environment. Skipping physical APK compile."
fi

echo -e "\n=========================================================="
echo "   CLEAN-ROOM SETUP & VERIFICATION COMPLETED SUCCESSFULLY   "
echo "=========================================================="
