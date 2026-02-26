
$cmd = "ls -la /var/www/msg/backend/prisma/dev.db && echo '--- ENV START ---' && cat /var/www/msg/backend/.env && echo '--- ENV END ---' && echo '--- LOG START ---' && tail -n 20 /root/.pm2/logs/msg-backend-error.log && echo '--- LOG END ---'"
ssh root@37.233.84.128 $cmd
