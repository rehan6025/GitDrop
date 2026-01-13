import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import { DeploymentController } from './deployment.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'build-queue',
    }),
  ],
  providers: [DeploymentService],
  controllers: [DeploymentController],
})
export class DeploymentModule {}
