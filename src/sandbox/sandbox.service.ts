import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { kill, stderr, stdin, stdout } from 'process';

@Injectable()
export class SandboxService {
  async create(deploymentId: string) {
    return new Promise((resolve, reject) => {
      const proc = spawn('docker', [`run node:lts-alpine`]);

      proc.stdout.on('data', streamLogs);
      proc.stderr.on('data', streamLogs);

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
