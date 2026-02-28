-- DropForeignKey
ALTER TABLE "Deployments" DROP CONSTRAINT "Deployments_project_id_fkey";

-- AddForeignKey
ALTER TABLE "Deployments" ADD CONSTRAINT "Deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
