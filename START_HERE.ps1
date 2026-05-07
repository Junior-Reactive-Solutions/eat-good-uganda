# Eat Good Uganda — Local Development Startup Script
# Run this PowerShell script to start the full platform locally

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🍰 Eat Good Uganda - Local Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$prereqs = @("pnpm", "node", "git")
$missing = @()

foreach ($tool in $prereqs) {
    if (Get-Command $tool -ErrorAction SilentlyContinue) {
        Write-Host "✅ $tool installed" -ForegroundColor Green
    } else {
        $missing += $tool
        Write-Host "❌ $tool not found" -ForegroundColor Red
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n⚠️  Missing: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Please install missing tools and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "All prerequisites found!" -ForegroundColor Green
Write-Host ""

# Check .env file
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env created - please review and update if needed" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📋 Database Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Choose your database option:" -ForegroundColor Yellow
Write-Host "1. Docker (Recommended) - Easiest setup"
Write-Host "2. Local PostgreSQL - Already installed on your machine"
Write-Host "3. Skip - You'll handle database setup manually"
Write-Host ""
$dbChoice = Read-Host "Enter your choice (1, 2, or 3)"

switch ($dbChoice) {
    "1" {
        Write-Host ""
        Write-Host "🐳 Starting PostgreSQL Docker container..." -ForegroundColor Cyan

        # Check if Docker is running
        try {
            $null = docker ps 2>$null
            Write-Host "✅ Docker is running" -ForegroundColor Green
        } catch {
            Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
            exit 1
        }

        # Check if container already exists
        $existing = docker ps -a --filter "name=eatgood-db" --quiet

        if ($existing) {
            Write-Host "Found existing eatgood-db container, starting it..." -ForegroundColor Yellow
            docker start eatgood-db | Out-Null
        } else {
            Write-Host "Creating new PostgreSQL container..." -ForegroundColor Yellow
            docker run --name eatgood-db `
                -e POSTGRES_USER=postgres `
                -e POSTGRES_PASSWORD=postgres `
                -e POSTGRES_DB=eatgood `
                -p 5432:5432 `
                -d postgres:16-alpine | Out-Null
        }

        Write-Host "✅ PostgreSQL is running on localhost:5432" -ForegroundColor Green
        Write-Host "   User: postgres" -ForegroundColor Gray
        Write-Host "   Password: postgres" -ForegroundColor Gray
        Write-Host "   Database: eatgood" -ForegroundColor Gray
        $dbReady = $true
    }

    "2" {
        Write-Host ""
        Write-Host "Checking for local PostgreSQL..." -ForegroundColor Cyan

        # Try to connect to PostgreSQL
        try {
            # This is a simple check - if psql is available, assume PostgreSQL is set up
            if (Get-Command psql -ErrorAction SilentlyContinue) {
                Write-Host "✅ Local PostgreSQL appears to be installed" -ForegroundColor Green
                Write-Host "⚠️  Make sure:" -ForegroundColor Yellow
                Write-Host "   - PostgreSQL service is running" -ForegroundColor Gray
                Write-Host "   - Database 'eatgood' exists (or will be created)" -ForegroundColor Gray
                Write-Host "   - Connection: localhost:5432, user: postgres" -ForegroundColor Gray
                $dbReady = $true
            } else {
                Write-Host "⚠️  PostgreSQL command-line tools not found" -ForegroundColor Yellow
                Write-Host "    You'll need to start PostgreSQL and ensure it's ready" -ForegroundColor Gray
                $dbReady = $false
            }
        } catch {
            Write-Host "⚠️  Could not verify PostgreSQL installation" -ForegroundColor Yellow
            $dbReady = $false
        }
    }

    "3" {
        Write-Host ""
        Write-Host "⚠️  Skipping automatic database setup" -ForegroundColor Yellow
        Write-Host "Please ensure PostgreSQL is running before starting the app servers." -ForegroundColor Gray
        $dbReady = $false
    }

    default {
        Write-Host "Invalid choice. Skipping database setup." -ForegroundColor Red
        $dbReady = $false
    }
}

if ($dbReady) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "🗄️  Running Database Migrations" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Running pending migrations..." -ForegroundColor Yellow

    # Give database a moment to be ready
    Start-Sleep -Seconds 2

    # Run migrations
    pnpm migrate

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "❌ Migrations failed. Check your database configuration." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Development Servers" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting all apps in parallel..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📱 Apps will be available at:" -ForegroundColor Cyan
Write-Host "   🏪 Customer:      http://localhost:5173" -ForegroundColor Green
Write-Host "   🍰 Bakery Admin:  http://localhost:5174" -ForegroundColor Green
Write-Host "   👨‍💼 Super Admin:   http://localhost:5175" -ForegroundColor Green
Write-Host "   📡 API:           http://localhost:4000" -ForegroundColor Green
Write-Host "   📚 API Docs:      http://localhost:4000/api-docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start development servers
pnpm dev
