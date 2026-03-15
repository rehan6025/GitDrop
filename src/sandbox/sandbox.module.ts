import { Module } from '@nestjs/common';
import { SandboxService } from './sandbox.service.js';
import { DeploymentGatewayModule } from '../deployment/deployment-gateway.module.js';

@Module({
  imports: [DeploymentGatewayModule],
  providers: [SandboxService],
  exports: [SandboxService],
})
export class SandboxModule {}
