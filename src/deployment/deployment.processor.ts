import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { SandboxService } from '../sandbox/sandbox.service.js';
import { DeploymentGateway } from './deployment.gateway.js';

@Processor('build-queue')
export class DeploymentProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private sandbox: SandboxService,
    private gateway: DeploymentGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
        type: 'log',
        log: 'Starting deployment...',
      });
      await this.prisma.deploymentLogs.create({
        data: {
          message: 'Starting deployment...',
          deploymentId: job.data.deploymentId,
        },
      });
      await this.sandbox.create(job.data);
      await this.markReady(job);
    } catch (error) {
      await this.markFailed(job);
      throw error;
    }
  }

  async markReady(job: Job): Promise<any> {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'READY' },
    });

    await this.prisma.projects.update({
      where: { id: job.data.projectId },
      data: { status: 'READY' },
    });
    this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
      type: 'status',
      status: 'READY',
    });

    this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
      type: 'log',
      log: 'Deployment finished successfully',
    });
    await this.prisma.deploymentLogs.create({
      data: {
        message: 'Deployment finished successfully',
        deploymentId: job.data.deploymentId,
      },
    });

    this.gateway.sendProjectUpdate(job.data.projectId, {
      status: 'READY',
    });
  }

  async markFailed(job: Job): Promise<any> {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'FAIL' },
    });

    await this.prisma.projects.update({
      where: { id: job.data.projectId },
      data: { status: 'FAIL' },
    });

    this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
      type: 'status',
      status: 'FAIL',
    });

    this.gateway.sendProjectUpdate(job.data.projectId, {
      status: 'FAIL',
    });
  }

  // @OnWorkerEvent('active')
  // async onActive(job: Job) {
  //   console.log('reached active section ');
  //   await this.prisma.deployments.update({
  //     where: { id: job.data.deploymentId },
  //     data: { status: 'IN_PROGRESS', updatedAt: new Date() },
  //   });
  // }
  @OnWorkerEvent('active')
  async onActive(job: Job) {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    });

    await this.prisma.projects.update({
      where: { id: job.data.projectId },
      data: { status: 'IN_PROGRESS' },
    });

    this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
      type: 'status',
      status: 'IN_PROGRESS',
    });

    this.gateway.sendDeploymentUpdate(job.data.deploymentId, {
      type: 'log',
      log: 'Deployment in progress...',
    });
    await this.prisma.deploymentLogs.create({
      data: {
        message: 'Deployment in progress...',
        deploymentId: job.data.deploymentId,
      },
    });

    this.gateway.sendProjectUpdate(job.data.projectId, {
      status: 'IN_PROGRESS',
    });
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    console.log('Job completed successfully , check db, state is ready');
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    console.error('ERROR deploying project:', job.data);
  }

  async wait(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time * 1000));
  }
}
