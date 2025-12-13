-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb;
