import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { rm, mkdir } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SandboxService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.cleanupState(deploymentId);

    const baseDir = 'C:/Users/Rehan/Desktop/backup_coding/Projects/deployments';
    const projectDir = `${baseDir}/project-${projectId}`;
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

      proc.stdout.on('data', (data) => {
        console.log(`[${deploymentId}]`, data.toString());
      });

      proc.stderr.on('data', (data) => {
        console.log(`[${deploymentId}]`, data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Container exited with code ${code}`));
      });
    });
  }
}
