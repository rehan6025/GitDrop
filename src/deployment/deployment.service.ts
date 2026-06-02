import { InjectQueue } from '@nestjs/bullmq';
import { Body, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeploymentGateway } from './deployment.gateway.js';
import { ProjectType } from '../../generated/prisma/enums.js';
import axios from 'axios';

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
      update: {
        repoUrl,
        url,
        type,
        status: 'IN_PROGRESS',
      },
      create: {
        name,
        repoUrl,
        url,
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
          repoUrl: project.repoUrl,
          branch,
          type: type,
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
      this.logger.log(`Build successfully added to the build queue`);

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

  async getDeploymentLogs(deploymentId: number, userId: number) {
    this.logger.log('Hit deployment service , retreiving dep logs from db');
    const deployment = await this.prisma.deployments.findFirst({
      where: {
        id: deploymentId,
        project: {
          user_id: userId,
        },
      },
      include: { logs: true },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment.logs;
  }

  async getDeploymentAnalysis(deploymentId: number, userId: number) {
    const deployment = await this.prisma.deployments.findFirst({
      where: {
        id: deploymentId,
        project: {
          user_id: userId,
        },
      },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    const logs = deployment?.logs;
    const parsedLogs = JSON.stringify(logs);

    const res = await axios.post('http://ai-service:8000/analyze', {
      text: parsedLogs,
    });

    return res.data;
  }

  async getStatus(deploymentId: number, userId: number) {
    const deployment = await this.prisma.deployments.findFirst({
      where: {
        id: deploymentId,
        project: {
          user_id: userId,
        },
      },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment.status;
  }
}
