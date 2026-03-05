import {
  Injectable,
  Logger,
  NotFoundException,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  signUp(): string {
    //building a query to send to github
    this.logger.log(
      'Github signup request hit , redirecting to github oauth endpoint',
    );
    const query = `https://github.com/login/oauth/authorize?client_id=${this.configService.get('CLIENT_ID')}&redirect_uri=${this.configService.get('REDIRECT_URI')}&scope=user%20repo`;

    return query;
  }

  async callback(code: string) {
    try {
      this.logger.log('Github callback received');

      const tokenUrl = `https://github.com/login/oauth/access_token`;

      this.logger.log('Requesting GitHub access token');

      const { data } = await axios.post(
        tokenUrl,
        {
          client_id: this.configService.get('CLIENT_ID'),
          client_secret: this.configService.get('CLIENT_SECRET'),
          code,
        },
        { headers: { Accept: 'application/json' } },
      );

      const accessToken = data.access_token;
      if (!accessToken) {
        this.logger.error('Github access token missing');
        throw new Error('GitHub OAuth failed');
      }

      this.logger.log('Access token received');

      const { data: githubUser } = await axios.get(
        'https://api.github.com/user',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      this.logger.log(`GitHub user fetched: ${githubUser.login}`);

      const user = await this.prisma.user.upsert({
        where: {
          githubId: githubUser.id.toString(),
        },
        update: {
          githubAuth: {
            upsert: {
              update: {
                accessToken: accessToken,
                lastLoginAt: new Date(),
              },
              create: {
                accessToken: accessToken,
              },
            },
          },
        },
        create: {
          githubId: githubUser.id.toString(),
          username: githubUser.login,
          githubAuth: {
            create: {
              accessToken,
            },
          },
        },
      });

      this.logger.log(`User stored in DB: ${user.id}`);

      const payload = {
        id: user.id,
        githubId: user.githubId,
        githubUsername: user.username,
      };

      return this.jwtService.sign(payload);
    } catch (error) {
      this.logger.error('GitHub OAuth callback failed', error.stack);
      throw error;
    }
  }

  async getProfile(userId: number) {
    try {
      this.logger.log('Get profile request received');
      const data = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      this.logger.log(`Returning user data : ${data?.id}`);

      return data;
    } catch (error) {
      this.logger.error('Error getting user profile details', error.stack);
      throw error;
    }
  }
}
