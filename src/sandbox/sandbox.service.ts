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

  async create(deploymentId: string) {
    await this.cleanupState(deploymentId);
    return new Promise<void>((resolve, reject) => {
      const proc = spawn('docker', [
        'run',
        '--rm',
        `--name`,
        `deployment-${deploymentId}`,
        'node:lts-alpine',
        'node',
        '-e',
        "console.log('hello');",
      ]);

      proc.stdout.on('data', (data) => {
        console.log(`[${deploymentId}]`, data.toString());
      });
      proc.stderr.on('data', (data) => {
        console.log(`[${deploymentId}]`, data.toString());
      });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Exit code ${code}`));
      });
    });
  }
}

// const dockerCmd =
//   'docker run --name base-static node:lts-alpine node -e "console.log(\'hello from inside our container\')"';

// exec(dockerCmd, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout.toString()}`);
//   console.error(`stderr: ${stderr}`);
// });

// const logsCmd = 'docker logs base-static';
// exec(logsCmd, (error, stdout, stderr) => {
//   if (error) {
//     if (error) {
//       console.error(`exec error: ${error}`);
//       return;
//     }
//     console.log(`stdout: ${stdout.toString()}`);
//     console.error(`stderr: ${stderr.toString()}`);
//   }
// });

// const killCmd = 'docker rm -f base-static';
// exec(killCmd, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout.toString()}`);
//   console.error(`stderr: ${stderr.toString()}`);
// });

// // stdin.pipe(stdout);
