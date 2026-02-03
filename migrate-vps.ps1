$cmd = @'
cd /var/www/msg/backend && rm -rf prisma/migrations/20260203135229_add_cascade_delete_user_relations && npx prisma migrate resolve --rolled-back 20260203135229_add_cascade_delete_user_relations || true && sqlite3 dev.db 'ALTER TABLE "User" DROP COLUMN "resetToken";' || true && sqlite3 dev.db 'ALTER TABLE "User" DROP COLUMN "resetTokenExpires";' || true && git pull origin main && npx prisma migrate deploy && pm2 restart msg-backend
'@

ssh root@37.233.84.128 $cmd
