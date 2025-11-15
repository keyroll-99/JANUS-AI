#!/usr/bin/env pwsh
# Docker management script for JANUS AI

param(
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet('up', 'down', 'restart', 'logs', 'build', 'status', 'clean', 'dev')]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$Service = ''
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"
🐋 JANUS AI Docker Management Script

Usage: .\docker.ps1 <command> [service]

Commands:
  up          Start all services (production mode)
  down        Stop all services
  restart     Restart services
  logs        Show logs (add service name for specific service)
  build       Rebuild images
  status      Show status of all services
  clean       Remove all containers, volumes and images
  dev         Start in development mode

Examples:
  .\docker.ps1 up              # Start production
  .\docker.ps1 dev             # Start development
  .\docker.ps1 logs backend    # Show backend logs
  .\docker.ps1 restart frontend # Restart frontend only
  .\docker.ps1 clean           # Clean everything

"@
}

function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    } catch {
        Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        return $false
    }
}

function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
        Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "✅ .env file created. Please edit it with your values." -ForegroundColor Green
            Write-Host ""
            return $false
        } else {
            Write-Host "❌ .env.example not found!" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    exit 1
}

# Check for .env file
if (-not (Test-EnvFile)) {
    Write-Host ""
    Write-Host "Please configure your .env file before continuing." -ForegroundColor Yellow
    exit 1
}

# Execute commands
switch ($Command) {
    'up' {
        Write-Host "🚀 Starting JANUS AI in production mode..." -ForegroundColor Green
        docker-compose up -d
        Write-Host ""
        Write-Host "✅ Services started!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Backend:  http://localhost:5000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Run '.\docker.ps1 logs' to see logs" -ForegroundColor Yellow
    }
    
    'dev' {
        Write-Host "🚀 Starting JANUS AI in development mode..." -ForegroundColor Green
        docker-compose -f docker-compose.dev.yml up -d
        Write-Host ""
        Write-Host "✅ Services started!" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:5173 (Vite dev server)" -ForegroundColor Cyan
        Write-Host "Backend:  http://localhost:5000 (hot reload)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Run '.\docker.ps1 logs' to see logs" -ForegroundColor Yellow
    }
    
    'down' {
        Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
        docker-compose down
        docker-compose -f docker-compose.dev.yml down 2>$null
        Write-Host "✅ Services stopped" -ForegroundColor Green
    }
    
    'restart' {
        Write-Host "♻️  Restarting services..." -ForegroundColor Yellow
        if ($Service) {
            docker-compose restart $Service
        } else {
            docker-compose restart
        }
        Write-Host "✅ Services restarted" -ForegroundColor Green
    }
    
    'logs' {
        if ($Service) {
            Write-Host "📋 Showing logs for $Service..." -ForegroundColor Cyan
            docker-compose logs -f $Service
        } else {
            Write-Host "📋 Showing all logs..." -ForegroundColor Cyan
            docker-compose logs -f
        }
    }
    
    'build' {
        Write-Host "🔨 Building images..." -ForegroundColor Yellow
        docker-compose build --no-cache
        Write-Host "✅ Build complete" -ForegroundColor Green
    }
    
    'status' {
        Write-Host "📊 Services status:" -ForegroundColor Cyan
        Write-Host ""
        docker-compose ps
        Write-Host ""
        Write-Host "💾 Disk usage:" -ForegroundColor Cyan
        docker system df
    }
    
    'clean' {
        Write-Host "⚠️  WARNING: This will remove all containers, volumes and images!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
            docker-compose down -v
            docker-compose -f docker-compose.dev.yml down -v 2>$null
            docker system prune -af --volumes
            Write-Host "✅ Cleanup complete" -ForegroundColor Green
        } else {
            Write-Host "Cancelled" -ForegroundColor Yellow
        }
    }
    
    default {
        Show-Help
    }
}
