import { Injectable, Logger } from '@nestjs/common';
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

  private readonly devLogger = new Logger(SandboxService.name);

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
    const bDir = process.env.DEPLOYMENTS_DIR;
    const baseDir = bDir;
    const projectDir = `${baseDir}/${url}`;
    const outputDir = `${projectDir}/current`;
    console.log(outputDir);

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

    this.devLogger.log(`Reached inside sandbox service for : ${deploymentId}`);
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
    this.devLogger.log(
      `Updated db state for deploymen: ${deploymentId} and project :${projectId}`,
    );

    this.devLogger.log(`Cleaning old state `);
    await this.cleanupState(deploymentId);

    this.devLogger.log(
      `Preparing new dirs with url :${url} for id: ${deploymentId}`,
    );
    const outputDir = await this.prepareDirectories(url);

    const shellCommand = strategy.getCommand(
      repoUrl,
      branch,
      outputDir,
      commitHash,
      buildCommand,
    );

    return new Promise<void>((resolve, reject) => {
      this.devLogger.log(
        `Spawning child process with docker for id: ${deploymentId}`,
      );
      const proc = spawn('docker', [
        'run',
        '--rm',
        '--name',
        `deployment-${deploymentId}`,

        '--cpus',
        '1.0',

        '-v',
        `${process.env.MACHINE_DEPLOYMENTS_PATH}:/deployments`,
        'node:lts-alpine',
        'sh',
        '-c',
        `timeout 420 sh -c "${shellCommand}"`,
      ]);

      proc.stdout.on('data', async (data) => {
        this.logger.log(deploymentId, data);
        this.devLogger.log('sending updates via ws');
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
