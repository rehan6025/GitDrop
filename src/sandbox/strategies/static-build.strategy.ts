import { IBuildStrategy } from '../interfaces/build-strategy.interface.js';

export class StaticBuildStrategy implements IBuildStrategy {
  getCommand(
    repoUrl: string,
    branch: string,
    commitHash?: string,
    buildCommand?: string,
  ): string {
    return `apk add --no-cache git && mkdir -p /app && cd /app && git clone "${repoUrl}" repo && cd repo && ${commitHash ? `git checkout ${commitHash}` : `git checkout ${branch} && git rev-parse HEAD`} && cp -r ./* /output`.trim();
  }
}
