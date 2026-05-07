# =============================================================================
# install.ps1 — Eat Good Uganda context pack installer
# -----------------------------------------------------------------------------
# Purpose: extract (or move) the context pack into the canonical project root
#          at D:\Junior Reactive Projects\eatgooduganda.
#
# Usage:
#   Option A — you received a zip:
#     powershell -ExecutionPolicy Bypass -File install.ps1 -ZipPath "C:\path\to\eatgooduganda-context-pack.zip"
#
#   Option B — you already extracted and are sitting inside the context pack:
#     powershell -ExecutionPolicy Bypass -File install.ps1
#
#   Option C — dry run (show what would happen, change nothing):
#     powershell -ExecutionPolicy Bypass -File install.ps1 -DryRun
#
# The script is idempotent: running twice does not duplicate files. Existing
# files at the destination are backed up to a timestamped folder before being
# overwritten, unless -Force is passed.
# =============================================================================

[CmdletBinding()]
param(
    [string]$ZipPath = "",
    [string]$Destination = "D:\Junior Reactive Projects\eatgooduganda",
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Msg)
    Write-Host ""
    Write-Host "==> $Msg" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Msg)
    Write-Host "    $Msg" -ForegroundColor Gray
}

function Write-Ok {
    param([string]$Msg)
    Write-Host "    $Msg" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Msg)
    Write-Host "    $Msg" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Msg)
    Write-Host "    $Msg" -ForegroundColor Red
}

Write-Step "Eat Good Uganda — context pack installer"
Write-Info "Destination : $Destination"
Write-Info "Zip path    : $(if ($ZipPath) { $ZipPath } else { '(not provided — running from extracted folder)' })"
Write-Info "Dry run     : $DryRun"
Write-Info "Force       : $Force"

# -----------------------------------------------------------------------------
# 1. Determine source directory
# -----------------------------------------------------------------------------
Write-Step "Locating source"

if ($ZipPath) {
    if (-not (Test-Path $ZipPath)) {
        Write-Err "Zip not found at: $ZipPath"
        exit 1
    }
    $tempExtract = Join-Path $env:TEMP "eatgood-extract-$(Get-Random)"
    Write-Info "Extracting to temp: $tempExtract"
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $tempExtract -Force | Out-Null
        Expand-Archive -Path $ZipPath -DestinationPath $tempExtract -Force
    }
    # The zip contains a top-level eatgooduganda/ folder — reach inside it
    $inner = Join-Path $tempExtract "eatgooduganda"
    if (Test-Path $inner) {
        $source = $inner
    } else {
        $source = $tempExtract
    }
} else {
    $source = (Get-Location).Path
    Write-Info "Source (cwd): $source"
    # Sanity check — this script itself should be in the source
    if (-not (Test-Path (Join-Path $source "install.ps1"))) {
        Write-Err "install.ps1 is not in the current working directory. Re-run from inside the extracted context pack, or pass -ZipPath."
        exit 1
    }
}

# -----------------------------------------------------------------------------
# 2. Prepare destination
# -----------------------------------------------------------------------------
Write-Step "Preparing destination"

$parent = Split-Path -Parent $Destination
if (-not (Test-Path $parent)) {
    Write-Info "Creating parent folder: $parent"
    if (-not $DryRun) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
}

if (Test-Path $Destination) {
    $existing = Get-ChildItem $Destination -Force | Measure-Object
    if ($existing.Count -gt 0) {
        if ($Force) {
            Write-Warn "Destination is not empty. -Force supplied — will overwrite in place."
        } else {
            $backupName = "eatgooduganda_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            $backupPath = Join-Path $parent $backupName
            Write-Warn "Destination is not empty. Backing up existing contents to:"
            Write-Warn "  $backupPath"
            if (-not $DryRun) {
                Move-Item -Path $Destination -Destination $backupPath
                New-Item -ItemType Directory -Path $Destination -Force | Out-Null
            }
        }
    }
} else {
    Write-Info "Creating destination: $Destination"
    if (-not $DryRun) { New-Item -ItemType Directory -Path $Destination -Force | Out-Null }
}

# -----------------------------------------------------------------------------
# 3. Copy files
# -----------------------------------------------------------------------------
Write-Step "Copying context pack"

# Use robocopy for robust, resumable copy (native to Windows).
# /E   : copy subfolders including empty
# /XD  : exclude dirs — skip node_modules, .git, temp noise if present
# /XF  : exclude files — install.ps1 itself (optional)
# /NFL /NDL /NJH /NJS : quiet output
# /R:1 /W:1 : 1 retry, 1-sec wait (fail fast)
$robocopyArgs = @(
    $source,
    $Destination,
    "/E",
    "/XD", "node_modules", ".git", "dist", "build", ".next", ".vercel", ".turbo",
    "/R:1",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS"
)

if ($DryRun) {
    $robocopyArgs += "/L"   # list only
    Write-Info "Dry run — robocopy will list but not copy"
}

Write-Info "Invoking robocopy..."
$process = Start-Process -FilePath "robocopy.exe" -ArgumentList $robocopyArgs -NoNewWindow -Wait -PassThru
# robocopy exit codes: 0-7 are success variants, >=8 is failure
if ($process.ExitCode -ge 8) {
    Write-Err "robocopy failed with exit code $($process.ExitCode)"
    exit 1
} else {
    Write-Ok "robocopy completed (exit code $($process.ExitCode))"
}

# -----------------------------------------------------------------------------
# 4. Post-install validation
# -----------------------------------------------------------------------------
Write-Step "Validating install"

$required = @(
    "README.md",
    "CLAUDE.md",
    ".gitignore",
    ".env.example",
    "docs\01-ARCHITECTURE.md",
    "docs\03-MULTI_TENANCY.md",
    "instructions\00-canonical-rules.md",
    "prompts\00-build-order.md"
)

$missing = @()
foreach ($f in $required) {
    $full = Join-Path $Destination $f
    if (-not (Test-Path $full)) { $missing += $f }
}

if ($missing.Count -gt 0 -and -not $DryRun) {
    Write-Err "The following required files are missing after copy:"
    $missing | ForEach-Object { Write-Err "  $_" }
    exit 1
} else {
    Write-Ok "All required files present."
}

# -----------------------------------------------------------------------------
# 5. Next steps
# -----------------------------------------------------------------------------
Write-Step "Done"
Write-Host ""
Write-Host "Context pack installed at: $Destination" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd `"$Destination`"" -ForegroundColor Gray
Write-Host "  2. git init && git add . && git commit -m 'chore: initial context pack'" -ForegroundColor Gray
Write-Host "  3. Read README.md, then docs\03-MULTI_TENANCY.md" -ForegroundColor Gray
Write-Host "  4. Open prompts\00-build-order.md and start Prompt 01 in your AI assistant" -ForegroundColor Gray
Write-Host ""
