import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
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

    const repos = await this.githubService.getRepos(user);

    return repos;
  }

  @UseGuards(AuthGuard)
  @Get('repos/:owner/:repo/branches')
  getBranches(
    @Req() req,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
  ) {
    return this.githubService.getBranches(req.user, owner, repo);
  }
}
