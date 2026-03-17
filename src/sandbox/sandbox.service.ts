import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { rm, mkdir } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service.js';
import { DeploymentGateway } from '../deployment/deployment.gateway.js';

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

  async create(jobData: any) {
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

    const baseDir = 'C:/Users/Rehan/Desktop/backup_coding/Projects/deployments';
    const projectDir = `${baseDir}/${url}`;
    const outputDir = `${projectDir}/current`;

    await rm(outputDir, { recursive: true, force: true });
    await mkdir(outputDir, { recursive: true });

    return new Promise<void>((resolve, reject) => {
      const shellCommand = `
        apk add --no-cache git &&
        mkdir -p /app &&
        cd /app &&
        git clone ${repoUrl} repo &&
        cd repo &&
        ${
          commitHash
            ? `git checkout ${commitHash}`
            : `git checkout ${branch} && git rev-parse HEAD`
        } &&
          ${
            buildCommand
              ? `
        npm install &&
        ${buildCommand} &&
        cp -r dist/* /output || cp -r build/* /output
      `
              : `
        cp -r ./* /output
      `
          }
      `;

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
        const log = data.toString();

        console.log(`[${deploymentId}]`, log);
        this.gateway.sendDeploymentUpdate(deploymentId, {
          type: 'log',
          log,
        });

        await this.prisma.deploymentLogs.create({
          data: {
            message: log,
            deploymentId: deploymentId,
          },
        });
      });

      proc.stderr.on('data', (data) => {
        const log = data.toString().trim();

        console.log(`[${deploymentId}]`, log);

        // skip apk install logs
        if (/^\(\s*\d+\/\d+\)/.test(log)) return;

        this.gateway.sendDeploymentUpdate(deploymentId, {
          type: 'log',
          log,
        });

        this.prisma.deploymentLogs
          .create({
            data: {
              message: log,
              deploymentId,
            },
          })
          .catch(console.error);
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Container exited with code ${code}`));
      });
    });
  }
}
