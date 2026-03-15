import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('deployment')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  addToBuild(@Req() request: Request) {
    const { repoUrl, commitHash, branch, name, type, buildCommand, url } =
      request.body;
    //@ts-ignore
    const userId = request.user.id;

    return this.deploymentService.enqueueDeployment(
      name,
      userId,
      repoUrl,
      type,
      branch,
      url,
      commitHash,
      buildCommand,
    );
  }

  @Get('/:id/logs')
  @UseGuards(AuthGuard)
  getLogs(@Param('id') deploymentId: string, @Req() request: Request) {
    const userId = (request as Request & { user: { id: string } }).user.id;
    return this.deploymentService.getDeploymentLogs(
      Number(deploymentId),
      Number(userId),
    );
  }
  @Get('/:id/status')
  @UseGuards(AuthGuard)
  getStatus(@Param('id') deploymentId: string, @Req() request: Request) {
    const userId = (request as Request & { user: { id: string } }).user.id;
    return this.deploymentService.getStatus(
      Number(deploymentId),
      Number(userId),
    );
  }
}
