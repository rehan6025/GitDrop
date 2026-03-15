-- CreateTable
CREATE TABLE "DeploymentLogs" (
    "id" SERIAL NOT NULL,
    "deploymentId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeploymentLogs" ADD CONSTRAINT "DeploymentLogs_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
