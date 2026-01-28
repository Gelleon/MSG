/*
  Warnings:

  - You are about to drop the `_RoomParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_RoomParticipants_B_index";

-- DropIndex
DROP INDEX "_RoomParticipants_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_RoomParticipants";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoomMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "adminId" TEXT NOT NULL,
    "targetId" TEXT,
    "roomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActionLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActionLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Invitation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitation_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invitation" ("createdAt", "creatorId", "expiresAt", "id", "isUsed", "role", "roomId", "token") SELECT "createdAt", "creatorId", "expiresAt", "id", "isUsed", "role", "roomId", "token" FROM "Invitation";
DROP TABLE "Invitation";
ALTER TABLE "new_Invitation" RENAME TO "Invitation";
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE TABLE "new_PrivateSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "PrivateSession_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateSession_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PrivateSession" ("createdAt", "endedAt", "id", "initiatorId", "isActive", "targetId") SELECT "createdAt", "endedAt", "id", "initiatorId", "isActive", "targetId" FROM "PrivateSession";
DROP TABLE "PrivateSession";
ALTER TABLE "new_PrivateSession" RENAME TO "PrivateSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RoomMember_userId_roomId_key" ON "RoomMember"("userId", "roomId");
