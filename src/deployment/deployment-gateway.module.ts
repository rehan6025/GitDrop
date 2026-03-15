import { Module } from '@nestjs/common';
import { DeploymentGateway } from './deployment.gateway.js';

@Module({
  providers: [DeploymentGateway],
  exports: [DeploymentGateway],
})
export class DeploymentGatewayModule {}


