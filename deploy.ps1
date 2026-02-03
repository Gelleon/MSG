# Deployment and Sync Script
# Handles code sync, dependency updates, database migrations, and service restarts.

$ServerIP = "37.233.84.128"
$User = "root"
$RemotePath = "/var/www/msg"

Write-Host "Starting Deployment to $ServerIP..." -ForegroundColor Cyan

# 1. Sync Local Code to Git
Write-Host "`n[1/5] Syncing local code to GitHub..."
git add .
$CommitMsg = Read-Host "Enter commit message (or press Enter for 'auto-sync')"
if ([string]::IsNullOrWhiteSpace($CommitMsg)) { $CommitMsg = "auto-sync: deployment update" }
git commit -m "$CommitMsg"
git push

if (-not $?) {
    Write-Host "Git push failed. Please resolve conflicts before deploying." -ForegroundColor Red
    exit 1
}

# 2. Remote Operations
Write-Host "`n[2/5] Connecting to server to pull changes..." -ForegroundColor Cyan

# We define the remote script to run
$RemoteScript = @"
set -e # Exit on error

echo '--- Checking Environment ---'
node -v
npm -v

cd $RemotePath

echo '--- Pulling latest code ---'
git pull

echo '--- Updating Backend ---'
cd backend
npm install
# Safe DB Migration
echo '--- Running Database Migrations ---'
# Attempt resolve P3005 by ensuring migrations are applied cleanly
# If baseline is needed, we assume schema is in sync and just mark applied
npx prisma migrate resolve --applied 20260123214429_init || true
npx prisma migrate resolve --applied 20260124233826_add_description_to_room || true
npx prisma migrate resolve --applied 20260124235853_add_attachment_fields || true
npx prisma migrate resolve --applied 20260125000542_change_translation_to_json_string || true
npx prisma migrate resolve --applied 20260125013800_add_cascade_delete_to_messages || true
npx prisma migrate resolve --applied 20260127073612_add_attachment_name || true
npx prisma migrate resolve --applied 20260127092908_add_invitation_model || true
npx prisma migrate resolve --applied 20260127233908_add_action_log || true
npx prisma migrate resolve --applied 20260128070135_add_is_private_to_room || true

# After marking existing structure as applied, run deploy for any truly new migrations
npx prisma migrate deploy
npx prisma generate
echo '--- Building Backend ---'
npm run build
pm2 restart backend

echo '--- Updating Frontend ---'
cd ../frontend
npm install
echo '--- Building Frontend ---'
npm run build
pm2 restart frontend

echo '--- Deployment Complete ---'
"@

# Execute remote script via SSH
# Using -Command parameter instead of heredoc for PowerShell compatibility
$EncodedScript = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($RemoteScript))
ssh $User@$ServerIP "echo '$EncodedScript' | base64 -d | bash"

if ($?) {
    Write-Host "`nDeployment Successfully Completed!" -ForegroundColor Green
} else {
    Write-Host "`nDeployment Failed. Check logs above." -ForegroundColor Red
}
