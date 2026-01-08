import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    return res.redirect('http://localhost:5173');
  }
}
