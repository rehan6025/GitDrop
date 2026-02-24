import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectType } from 'generated/prisma/enums.js';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectQueue('build-queue') private buildQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueDeployment(
    name: string,
    userId: number,
    repoUrl: string,
    type: ProjectType,
    branch: string,
    commitHash?: string,
    buildCommand?: string,
  ) {
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
        url: `${name}`,
        type,
        user: { connect: { id: userId } },
      },
    });

    const deployment = await this.prisma.deployments.create({
      data: {
        status: 'QUEUED',

        commitHash: commitHash ?? null,
        project_id: project.id,
      },
    });

    try {
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
      await this.prisma.deployments.update({
        where: { id: deployment.id },
        data: { status: 'FAIL' },
      });
      throw error;
    }
  }
}
