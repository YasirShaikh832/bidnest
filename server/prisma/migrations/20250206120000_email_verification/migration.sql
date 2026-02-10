-- Remove phone/WhatsApp; add email verification and email alerts
ALTER TABLE "User" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerifiedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "whatsappNotifications";
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailAlerts" BOOLEAN NOT NULL DEFAULT false;
