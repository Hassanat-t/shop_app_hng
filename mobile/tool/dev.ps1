<#
.SYNOPSIS
    Builds or runs the tt's pink oven Flutter app on Windows, avoiding the
    OneDrive file-lock failures that break `flutter run` and `flutter clean`.

.DESCRIPTION
    This project lives inside a OneDrive-synced folder. OneDrive's sync service
    keeps transient handles on files under build\, so Gradle's cleanMergeDebugAssets
    task fails with "Unable to delete directory ... mergeDebugAssets" and
    `flutter clean` fails with "Failed to remove build".

    The reliable fix is to stop the Gradle daemons first (they hold the build tree
    open), delete the build directory ourselves, and only then invoke Flutter.
    Any extra arguments are passed straight through to Flutter.

.PARAMETER Clean
    Run `flutter clean` before building (full reset, slow).

.PARAMETER Build
    Build a debug APK instead of deploying to a connected device.

.PARAMETER SkipDaemonStop
    Leave Gradle daemons running. Faster, but reintroduces the lock risk.

.PARAMETER FlutterArgs
    Any remaining arguments are forwarded to `flutter run` / `flutter build apk`.
    Example: .\tool\dev.ps1 --dart-define=GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com

.EXAMPLE
    .\tool\dev.ps1
    Stop daemons, then `flutter run`.

.EXAMPLE
    .\tool\dev.ps1 -Clean
    Stop daemons, full clean, then `flutter run`.

.EXAMPLE
    .\tool\dev.ps1 -Build
    Stop daemons, then build the debug APK.
#>
[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$Build,
    [switch]$SkipDaemonStop,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$FlutterArgs
)

$ErrorActionPreference = 'Stop'

# Resolve paths from this script's location so it works from any directory.
$projectRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $projectRoot 'android'
$gradlew = Join-Path $androidDir 'gradlew.bat'

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "    warning: $Message" -ForegroundColor Yellow
}

# 1. Stop the Gradle daemons. They survive a failed build and keep the build
#    tree open, which is what makes the delete below (and Gradle's own asset
#    merge) fail. Skipped with -SkipDaemonStop.
if (-not $SkipDaemonStop) {
    if (Test-Path $gradlew) {
        Write-Step 'Stopping Gradle daemons'
        Push-Location $androidDir
        try {
            & $gradlew --stop
        }
        catch {
            Write-Warn "could not stop Gradle daemons: $($_.Exception.Message)"
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Warn "gradlew.bat not found at $gradlew; skipping daemon stop"
    }
}

# 2. Remove build\ ourselves. `flutter clean` also tries to delete .dart_tool,
#    which VS Code's Dart language server holds open; we only care about build\.
$buildDir = Join-Path $projectRoot 'build'
if (Test-Path $buildDir) {
    Write-Step 'Removing stale build directory'
    try {
        Remove-Item -Recurse -Force $buildDir
    }
    catch {
        Write-Warn "could not fully remove build\: $($_.Exception.Message)"
        Write-Warn 'if the build still fails, close Android Studio / any running'
        Write-Warn 'flutter session, exclude build\ from OneDrive sync, then retry.'
    }
}

# 3. Verify Flutter is reachable before doing expensive work.
if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    throw 'flutter was not found on PATH. Add the Flutter SDK bin directory to PATH.'
}

# 4. Optional full clean. Non-fatal: a partially deleted build\ is still usable
#    because the daemons are already stopped.
if ($Clean) {
    Write-Step 'Running flutter clean'
    & flutter clean
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "flutter clean exited with $LASTEXITCODE; continuing"
    }
}

# 5. Hand off to Flutter.
if ($Build) {
    Write-Step 'Building debug APK'
    & flutter build apk --debug @FlutterArgs
}
else {
    Write-Step 'Running the app'
    & flutter run @FlutterArgs
}

if ($LASTEXITCODE -ne 0) {
    throw "flutter exited with code $LASTEXITCODE"
}

Write-Step 'Done'