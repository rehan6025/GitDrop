import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import { DeploymentController } from './deployment.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { BullModule } from '@nestjs/bullmq';
import { DeploymentProcessor } from './deployment.processor.js';
import { SandboxModule } from '../sandbox/sandbox.module.js';

@Module({
  imports: [
    SandboxModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'build-queue',
    }),
  ],
  providers: [DeploymentService, DeploymentProcessor],
  controllers: [DeploymentController],
})
export class DeploymentModule {}
