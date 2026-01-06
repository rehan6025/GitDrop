import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/github')
  signUp(@Res() response: Response): any {
    const query = this.authService.signUp();
    response.redirect(query);
  }

  @Get('/callback')
  callback(@Query('code') code: string) {
    return this.authService.callback(code);
  }
}
