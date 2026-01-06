import { Controller } from '@nestjs/common';
import { GithubService } from './github.service.js';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}
}
