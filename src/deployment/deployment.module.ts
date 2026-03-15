import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import { DeploymentController } from './deployment.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { BullModule } from '@nestjs/bullmq';
import { DeploymentProcessor } from './deployment.processor.js';
import { SandboxModule } from '../sandbox/sandbox.module.js';
import { DeploymentGatewayModule } from './deployment-gateway.module.js';

@Module({
  imports: [
    SandboxModule,
    DeploymentGatewayModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'build-queue',
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  providers: [DeploymentService, DeploymentProcessor],
  controllers: [DeploymentController],
  exports: [],
})
export class DeploymentModule {}
