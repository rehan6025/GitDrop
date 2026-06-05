import { IBuildStrategy } from '../interfaces/build-strategy.interface.js';

export class ReactBuildStrategy implements IBuildStrategy {
  getCommand(
    repoUrl: string,
    branch: string,
    outputDir: string,
    commitHash?: string,
    buildCommand?: string,
  ): string {
    return `echo "__STAGE__:CLONING" && apk add --no-cache git && mkdir -p /app && cd /app && git clone "${repoUrl}" repo && cd repo && ${commitHash ? `git checkout ${commitHash}` : `git checkout ${branch} && git rev-parse HEAD`} && echo "__STAGE__:INSTALLING" && npm install && echo "__STAGE__:BUILDING" && ${buildCommand} && echo "__STAGE__:COPYING" && cp -r dist/* ${outputDir} || cp -r build/* ${outputDir} && echo "__STAGE__:DONE" `.trim();
  }
}
