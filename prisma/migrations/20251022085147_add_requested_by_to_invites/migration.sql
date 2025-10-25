-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoomInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomId" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "requestedBy" TEXT,
    "inviteToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoomInvite_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RoomInvite_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RoomInvite" ("createdAt", "expiresAt", "id", "inviteToken", "invitedBy", "roomId", "status", "updatedAt") SELECT "createdAt", "expiresAt", "id", "inviteToken", "invitedBy", "roomId", "status", "updatedAt" FROM "RoomInvite";
DROP TABLE "RoomInvite";
ALTER TABLE "new_RoomInvite" RENAME TO "RoomInvite";
CREATE UNIQUE INDEX "RoomInvite_inviteToken_key" ON "RoomInvite"("inviteToken");
CREATE INDEX "RoomInvite_inviteToken_idx" ON "RoomInvite"("inviteToken");
CREATE INDEX "RoomInvite_roomId_idx" ON "RoomInvite"("roomId");
CREATE INDEX "RoomInvite_status_idx" ON "RoomInvite"("status");
CREATE INDEX "RoomInvite_requestedBy_idx" ON "RoomInvite"("requestedBy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
