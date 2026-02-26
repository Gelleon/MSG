
$cmd = "cd /var/www/msg/backend && echo '--- Migrating DB ---' && npx prisma migrate deploy && echo '--- Generating Client ---' && npx prisma generate && echo '--- Restarting Backend ---' && pm2 restart msg-backend"
ssh root@37.233.84.128 $cmd
