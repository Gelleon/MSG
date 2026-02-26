-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "resetToken" TEXT,
    "resetTokenExpires" DATETIME,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastNotificationSentAt" DATETIME,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "positionId" TEXT,
    CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "emailNotificationsEnabled", "id", "lastNotificationSentAt", "name", "password", "phone", "positionId", "resetToken", "resetTokenExpires", "role", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "emailNotificationsEnabled", "id", "lastNotificationSentAt", "name", "password", "phone", "positionId", "resetToken", "resetTokenExpires", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
