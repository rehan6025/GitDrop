import { Injectable, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma, PrismaClient } from '../../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  signUp(): string {
    //build a query to send to github
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

    return data;
  }
}
