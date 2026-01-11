import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/github')
  signUp(@Res() response: Response): any {
    const githubAuthUrl = this.authService.signUp();
    response.redirect(githubAuthUrl);
  }

  @Get('/callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const jwt = await this.authService.callback(code);

    res.cookie('jwt', jwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod (https)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const url = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(url ?? 'http://localhost:5173');
  }
}
