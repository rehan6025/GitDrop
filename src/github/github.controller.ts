import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service.js';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @UseGuards(AuthGuard)
  @Get('/repos')
  async getRepos(@Req() request: Request): Promise<any> {
    // @ts-ignore
    const user = request.user;
    return await this.githubService.getRepos(user);
  }
}
