import { Module } from '@nestjs/common';
import { SandboxService } from './sandbox.service.js';
import { DeploymentGatewayModule } from '../deployment/deployment-gateway.module.js';
import { BuildStrategyFactory } from './strategies/build-strategy.factory.js';

@Module({
  imports: [DeploymentGatewayModule],
  providers: [SandboxService, BuildStrategyFactory],
  exports: [SandboxService, BuildStrategyFactory],
})
export class SandboxModule {}
