import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
import { SandboxService } from '../sandbox/sandbox.service.js';
import { error } from 'console';

@Processor('build-queue')
export class DeploymentProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private sandbox: SandboxService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    try {
      await this.sandbox.create(job.data.deploymentId);
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
  }

  async markFailed(job: Job): Promise<any> {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'FAIL' },
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
