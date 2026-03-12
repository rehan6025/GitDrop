import { Module } from '@nestjs/common';
import { SandboxService } from './sandbox.service.js';
import { DeploymentGateway } from '../deployment/deployment.gateway.js';

@Module({
  providers: [SandboxService, DeploymentGateway],
  exports: [SandboxService],
})
export class SandboxModule {}
