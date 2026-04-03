import { Injectable } from '@nestjs/common';
import { DeploymentGateway } from '../deployment/deployment.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DeploymentLogger {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: DeploymentGateway,
  ) {}

  async log(deploymentId: number, message: string) {
    const log = message.toString().trim();
    if (!log) return;

    this.gateway.sendDeploymentUpdate(deploymentId, {
      type: 'log',
      log,
    });

    await this.prisma.deploymentLogs
      .create({
        data: {
          message: log,
          deploymentId: deploymentId,
        },
      })
      .catch(console.error);
  }
}
