import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('build-queue')
export class DeploymentProcessor extends WorkerHost {
  async process(job: Job) {
    console.log('Job received:', job.id, job.data);
  }
}
