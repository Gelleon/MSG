-- AlterTable
ALTER TABLE "ActionLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "ActionLog" ADD COLUMN "newRole" TEXT;
ALTER TABLE "ActionLog" ADD COLUMN "previousRole" TEXT;
ALTER TABLE "ActionLog" ADD COLUMN "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "ActionLog_roomId_createdAt_idx" ON "ActionLog"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionLog_adminId_createdAt_idx" ON "ActionLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionLog_action_createdAt_idx" ON "ActionLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");
