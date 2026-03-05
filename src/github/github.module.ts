import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GithubService } from './github.service.js';
import { GithubController } from './github.controller.js';

@Module({
  imports: [AuthModule],
  providers: [GithubService],
  controllers: [GithubController],
})
export class GithubModule {}
