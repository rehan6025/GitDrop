import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import axios from 'axios';

interface AuthenticatedUser {
  id: number;
  githubUsername: string;
  githubId: number;
}

@Injectable()
export class GithubService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger(GithubService.name);

  async getRepos(user: AuthenticatedUser): Promise<any> {
    this.logger.log('Get Repos endpoint hit');

    this.logger.log('Fetching user access token from db');
    const githubAuth = await this.prisma.githubAuth.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!githubAuth) {
      this.logger.error('access token of user not found');
      throw new Error('access token does not exist');
    }

    try {
      this.logger.log('Getting user repos from github api');
      const { data } = await axios.get(
        `https://api.github.com/users/${user.githubUsername}/repos`,
        {
          headers: {
            Authorization: `Bearer ${githubAuth.accessToken}`,
          },
        },
      );
      this.logger.log('Found user repos');
      return data;
    } catch (error) {
      this.logger.error(
        'Could not get user Repos, operation failed',
        error.stack,
      );
      throw new error();
    }
  }

  async getBranches(user: AuthenticatedUser, owner: string, repo: string) {
    this.logger.log(`Get branches endpoint hit for repo: ${repo}`);

    this.logger.log('Checking if access token of user exists or not');
    const githubAuth = await this.prisma.githubAuth.findUnique({
      where: { userId: user.id },
    });

    if (!githubAuth) {
      this.logger.error('access token of user not found');
      throw new Error('access token does not exist');
    }

    try {
      this.logger.log('Hitting github api for branches');

      const { data } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/branches`,
        {
          headers: {
            Authorization: `Bearer ${githubAuth.accessToken}`,
          },
        },
      );

      this.logger.log(`Got branches for repo: ${repo}`);

      return data.map((branch) => ({
        name: branch.name,
        sha: branch.commit.sha,
      }));
    } catch (error) {
      this.logger.error('Failed to get branches from github ', error.stack);
      throw new error();
    }
  }
}
