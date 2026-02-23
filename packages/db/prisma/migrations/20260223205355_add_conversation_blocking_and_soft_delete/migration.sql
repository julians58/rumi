-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "blocked_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_p1_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_p2_at" TIMESTAMP(3);
