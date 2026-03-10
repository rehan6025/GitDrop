-- DropIndex
DROP INDEX "Projects_repoUrl_key";

-- AlterTable
ALTER TABLE "Projects" ADD COLUMN     "branch" TEXT NOT NULL DEFAULT 'main';
