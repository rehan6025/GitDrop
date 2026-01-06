import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GithubService {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getRepos(): [] {}
}
