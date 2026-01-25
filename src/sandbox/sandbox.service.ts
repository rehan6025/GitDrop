import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class SandboxService {
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

  async create(deploymentId: string, repoUrl: string, buildCommand?: string) {
    await this.cleanupState(deploymentId);

    return new Promise<void>((resolve, reject) => {
      const shellCommand = `
        apk add --no-cache git &&
        mkdir -p /app &&
        cd /app &&
        git clone ${repoUrl} repo &&
        cd repo &&
        ${
          buildCommand
            ? `npm install && ${buildCommand}`
            : `echo "No build command provided, skipping build"`
        }
      `;

      const proc = spawn('docker', [
        'run',
        '--rm',
        '--name',
        `deployment-${deploymentId}`,
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
