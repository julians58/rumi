-- AlterTable: Convert language from nullable String to String array
-- Migrate existing data: convert single value to array, null to empty array
ALTER TABLE "users" ADD COLUMN "language_new" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "users" SET "language_new" = ARRAY["language"] WHERE "language" IS NOT NULL;

ALTER TABLE "users" DROP COLUMN "language";
ALTER TABLE "users" RENAME COLUMN "language_new" TO "language";
