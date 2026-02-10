-- AlterTable User: phone, phoneVerifiedAt, whatsappNotifications
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "whatsappNotifications" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Auction: type, scheduledStartAt
ALTER TABLE "Auction" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Auction" ADD COLUMN "scheduledStartAt" TIMESTAMP(3);

-- AlterTable Bid: type
ALTER TABLE "Bid" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'standard';
