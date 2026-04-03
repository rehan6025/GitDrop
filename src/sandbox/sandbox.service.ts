import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { rm, mkdir } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeploymentGateway } from '../deployment/deployment.gateway.js';
import { IBuildStrategy } from './interfaces/build-strategy.interface.js';
import { BuildStrategyFactory } from './strategies/build-strategy.factory.js';
import { DeploymentLogger } from './deployment-logger.service.js';

interface jobData {
  deploymentId: number;
  repoUrl: string;
  commitHash?: string;
  branch: string;
  projectId: number;
  buildCommand?: string;
  url: string;
}

@Injectable()
export class SandboxService {
  constructor(
    private readonly prisma: PrismaService,
    private gateway: DeploymentGateway,
    private logger: DeploymentLogger,
  ) {}

  async cleanupState(deploymentId: string) {
    await new Promise<void>((res) => {
      const cleanup = spawn('docker', [
        'rm',
        '-f',
        `deployment-${deploymentId}`,
      ]);
      cleanup.on('close', () => res());
    });
  }

  async prepareDirectories(url: string): Promise<string> {
    const baseDir = 'C:/Users/Rehan/Desktop/backup_coding/Projects/deployments';
    const projectDir = `${baseDir}/${url}`;
    const outputDir = `${projectDir}/current`;

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    return outputDir;
  }

  async create(jobData: any, strategy: IBuildStrategy) {
    const {
      deploymentId,
      repoUrl,
      commitHash,
      branch,
      projectId,
      buildCommand,
      url,
    } = jobData;

    await this.prisma.deployments.update({
      where: {
        id: deploymentId,
      },
      data: {
        status: 'IN_PROGRESS',
      },
    });
    await this.prisma.projects.update({
      where: {
        id: projectId,
      },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    await this.cleanupState(deploymentId);

    const outputDir = await this.prepareDirectories(url);

    const shellCommand = strategy.getCommand(
      repoUrl,
      branch,
      commitHash,
      buildCommand,
    );

    return new Promise<void>((resolve, reject) => {
      const proc = spawn('docker', [
        'run',
        '--rm',
        '--name',
        `deployment-${deploymentId}`,
        '-v',
        `${outputDir}:/output`,
        'node:lts-alpine',
        'sh',
        '-c',
        shellCommand,
      ]);

      proc.stdout.on('data', async (data) => {
        this.logger.log(deploymentId, data);
      });

      proc.stderr.on('data', (data) => {
        this.logger.log(deploymentId, data);
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Container exited with code ${code}`));
      });
    });
  }
}
