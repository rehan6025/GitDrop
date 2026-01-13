import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('deployment')
export class DeploymentController {
  constructor(private readonly deploymentService: DeploymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  addToBuild(@Req() request: Request) {
    const { repoUrl, commitHash, branch, name, type } = request.body;
    //@ts-ignore
    const userId = request.user.id;

    this.deploymentService.enqueueDeployment(
      name,
      userId,
      repoUrl,
      type,
      branch,
      commitHash,
    );
  }
}
