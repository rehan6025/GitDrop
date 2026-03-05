import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectType } from 'generated/prisma/enums.js';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectQueue('build-queue') private buildQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  private readonly logger = new Logger(DeploymentService.name);

  async enqueueDeployment(
    name: string,
    userId: number,
    repoUrl: string,
    type: ProjectType,
    branch: string,
    url: string,
    commitHash?: string,
    buildCommand?: string,
  ) {
    this.logger.log(`Enqueue Deployment endpoint hit for project:${name}`);
    const project = await this.prisma.projects.upsert({
      where: {
        user_id_name: {
          user_id: userId,
          name,
        },
      },
      update: {},
      create: {
        name,
        repoUrl,
        url: `${url}`,
        type,
        user: { connect: { id: userId } },
      },
    });
    this.logger.log(`Added db entry for project :${project.id}`);

    const deployment = await this.prisma.deployments.create({
      data: {
        status: 'QUEUED',
        commitHash: commitHash ?? null,
        project_id: project.id,
      },
    });

    this.logger.log(`Added deployment record in db:${deployment.id}`);

    try {
      this.logger.log(`adding to build queue , project url: ${project.url}`);
      await this.buildQueue.add(
        'build-job',
        {
          deploymentId: deployment.id,
          projectId: project.id,
          repoUrl,
          branch,
          commitHash: commitHash ?? null,
          buildCommand: buildCommand,
          url: project.url,
        },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
        },
      );

      return { deploymentId: deployment.id, status: 'QUEUED' };
    } catch (error) {
      this.logger.error(`Failed to enqueue deployement ${deployment.id}`);

      await this.prisma.deployments.update({
        where: { id: deployment.id },
        data: { status: 'FAIL' },
      });
      throw error;
    }
  }
}
