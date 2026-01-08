import { Injectable, Query, Req, Res } from '@nestjs/common';
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

  signUp(): string {
    //building a query to send to github
    const query = `https://github.com/login/oauth/authorize?client_id=${this.configService.get('CLIENT_ID')}&redirect_uri=${this.configService.get('REDIRECT_URI')}&scope=user%20repo`;

    return query;
  }

  async callback(code: string) {
    const tokenUrl = `https://github.com/login/oauth/access_token`;

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

    const { data: githubUser } = await axios.get(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

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

    const payload = {
      id: user.id,
      githubId: user.githubId,
      githubUsername: user.username,
    };

    return this.jwtService.sign(payload);
  }
}
