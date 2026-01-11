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
    const repoData = request.body;
    this.deploymentService.addToQueue(repoData);
  }
}
