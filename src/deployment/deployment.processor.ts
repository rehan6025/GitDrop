import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';

@Processor('build-queue')
export class DeploymentProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    await this.wait(15);
    return { success: true };
  }

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    console.log('reached active section ');
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    });
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'READY' },
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    await this.prisma.deployments.update({
      where: { id: job.data.deploymentId },
      data: { status: 'FAIL' },
    });

    console.error('ERROR deploying project:', job.data);
    console.error(err);
  }

  async wait(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time * 1000));
  }
}
