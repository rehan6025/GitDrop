import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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

  async getRepos(user: AuthenticatedUser): Promise<any> {
    const githubAuth = await this.prisma.githubAuth.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!githubAuth) {
      throw new UnauthorizedException('GitHub account not linked');
    }

    try {
      const { data } = await axios.get(
        `https://api.github.com/users/${user.githubUsername}/repos`,
        {
          headers: {
            Authorization: `Bearer ${githubAuth.accessToken}`,
          },
        },
      );

      return data;
    } catch (error) {
      throw new NotFoundException('Could not fetch Github repositories');
    }
  }

  async getBranches(user: AuthenticatedUser, owner: string, repo: string) {
    const githubAuth = await this.prisma.githubAuth.findUnique({
      where: { userId: user.id },
    });

    if (!githubAuth) {
      throw new UnauthorizedException('GitHub account not linked');
    }

    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/branches`,
        {
          headers: {
            Authorization: `Bearer ${githubAuth.accessToken}`,
          },
        },
      );

      return data.map((branch) => ({
        name: branch.name,
        sha: branch.commit.sha,
      }));
    } catch (err) {
      throw new NotFoundException('Could not fetch branches');
    }
  }
}
