export interface IBuildStrategy {
  getCommand(
    repoUrl: string,
    branch: string,
    outputDir: string,
    commitHash?: string,
    buildCommand?: string,
  ): string;
}
