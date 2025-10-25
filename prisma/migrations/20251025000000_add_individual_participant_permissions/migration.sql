-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN "canDelete" BOOLEAN;
ALTER TABLE "RoomParticipant" ADD COLUMN "canEdit" BOOLEAN;
ALTER TABLE "RoomParticipant" ADD COLUMN "canInvite" BOOLEAN;

-- AlterTable  
ALTER TABLE "Room" ADD COLUMN "timeRestricted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Room" ADD COLUMN "accessUntil" DATETIME;

