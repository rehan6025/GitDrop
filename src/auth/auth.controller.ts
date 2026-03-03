import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from './auth.guard.js';

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

  @Get('/me')
  @UseGuards(AuthGuard)
  getUserProfile(@Req() request: Request) {
    const userId = (request as Request & { user: { id: string } }).user.id;
    return this.authService.getProfile(Number(userId));
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  logout(@Req() request: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true in prod
    });
    return { msg: 'logged out successfully' };
  }
}
