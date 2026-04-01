export interface IBuildStrategy {
  getCommand(
    repoUrl: string,
    branch: string,
    commitHash?: string,
    buildCommand?: string,
  ): string;
}
