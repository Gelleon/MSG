# Setup SSH Key for Passwordless Access
# This script generates an SSH key (if needed) and copies it to the server.
# This is required for the automated deployment script to run without prompting for a password.

$ServerIP = "37.233.84.128"
$User = "root"

Write-Host "Setting up SSH access to $User@$ServerIP..." -ForegroundColor Cyan

# 1. Check if SSH key exists
$KeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (-not (Test-Path "$KeyPath")) {
    Write-Host "Generating new SSH key..."
    ssh-keygen -t rsa -b 4096 -f "$KeyPath" -N ""
} else {
    Write-Host "SSH key already exists."
}

# 2. Read the public key
$PublicKey = Get-Content "$KeyPath.pub"

# 3. Instruction to copy key
Write-Host "`nIMPORTANT: Automatic key copying requires manual password input once." -ForegroundColor Yellow
Write-Host "I will now attempt to copy the key to the server."
Write-Host "When prompted, please enter the server password: 12ms%52Pf1jK" -ForegroundColor Green

# Using ssh to append the key to authorized_keys
# We force pseudo-terminal allocation (-t) to ensure password prompt appears if needed, 
# though typically on Windows PowerShell this might still be tricky without ssh-copy-id.
# We'll use a direct command approach.

$RemoteCommand = "mkdir -p ~/.ssh && echo '$PublicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"

Write-Host "`nConnecting to server to install key..."
ssh $User@$ServerIP $RemoteCommand

if ($?) {
    Write-Host "`nSuccess! SSH key installed." -ForegroundColor Green
    Write-Host "You can now run .\deploy.ps1 without a password." -ForegroundColor Cyan
} else {
    Write-Host "`nFailed to install key." -ForegroundColor Red
    Write-Host "Please manually run this command in your terminal:"
    Write-Host "type $env:USERPROFILE\.ssh\id_rsa.pub | ssh $User@$ServerIP 'cat >> .ssh/authorized_keys'" -ForegroundColor Yellow
}
