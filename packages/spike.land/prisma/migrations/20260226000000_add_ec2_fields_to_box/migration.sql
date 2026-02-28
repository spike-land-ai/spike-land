-- AlterTable
ALTER TABLE "boxes" ADD COLUMN "ec2InstanceId" TEXT;
ALTER TABLE "boxes" ADD COLUMN "ec2Region" TEXT;
ALTER TABLE "boxes" ADD COLUMN "privateIp" TEXT;
ALTER TABLE "boxes" ADD COLUMN "publicIp" TEXT;
ALTER TABLE "boxes" ADD COLUMN "tunnelUrl" TEXT;
