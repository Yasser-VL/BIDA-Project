# Check for Administrator privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script needs to be run as Administrator to install software." -ForegroundColor Red
    Write-Host "Please right-click setup.bat and select 'Run as Administrator'."
    exit
}

$ErrorActionPreference = "Stop"

function Check-Command($cmd) {
    if (Get-Command $cmd -ErrorAction SilentlyContinue) {
        return $true
    }
    return $false
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Bida Project - Automated Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check and Install Node.js
if (Check-Command "node") {
    Write-Host "[OK] Node.js is already installed." -ForegroundColor Green
} else {
    Write-Host "[..] Node.js not found. Installing via Winget..." -ForegroundColor Yellow
    try {
        winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        # Refresh env vars for the current process
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "[OK] Node.js installed successfully." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install Node.js. Please install it manually from https://nodejs.org/" -ForegroundColor Red
        exit
    }
}

# 2. Check and Install MongoDB
if (Get-Service "MongoDB" -ErrorAction SilentlyContinue) {
    Write-Host "[OK] MongoDB Service is running." -ForegroundColor Green
} else {
    Write-Host "[..] MongoDB Service not found. Installing MongoDB Community Server..." -ForegroundColor Yellow
    try {
        winget install -e --id MongoDB.Server --accept-source-agreements --accept-package-agreements
        Write-Host "[OK] MongoDB installed." -ForegroundColor Green
        Write-Host "Starting MongoDB Service..."
        Start-Service "MongoDB"
    } catch {
        Write-Host "[!] Could not install or detect MongoDB automatically." -ForegroundColor Red
        Write-Host "    If you have it installed, ensure the service is named 'MongoDB'."
        Write-Host "    Otherwise, please install it from https://www.mongodb.com/try/download/community"
        # We don't exit here, we try to proceed, maybe they have a remote DB or different service name
    }
}

# 3. Install Webapp Dependencies
Write-Host ""
Write-Host "[..] Installing project dependencies (npm install)..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\webapp"
try {
    npm install
    Write-Host "[OK] Dependencies installed." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm install failed." -ForegroundColor Red
    exit
}

# 4. Import Data
Write-Host ""
Write-Host "[..] Importing Database Data..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\.."
# We assume mongoimport is in the path now (from MongoDB install)
# If not, we might need to find it, but standard install adds it.
# NOTE: Recent MongoDB versions separate Tools (mongoimport). Winget 'MongoDB.Server' might not include tools.
# Let's check for mongoimport
if (-not (Check-Command "mongoimport")) {
    Write-Host "[..] mongoimport not found. Installing MongoDB Database Tools..." -ForegroundColor Yellow
    try {
        winget install -e --id MongoDB.DatabaseTools --accept-source-agreements --accept-package-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } catch {
        Write-Host "[!] Cloud not install Database Tools. Data import might fail." -ForegroundColor Red
    }
}

# Run the batch file / specific command
# Using cmd to run the .bat logic simply
cmd /c "import_data.bat"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete! 🚀" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:"
Write-Host "1. cd webapp"
Write-Host "2. npm start"
Write-Host ""
Read-Host -Prompt "Press Enter to exit"
