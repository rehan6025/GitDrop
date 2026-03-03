import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(AuthGuard)
  getAllProjects(@Req() request: Request) {
    const userId = (request as Request & { user: { id: string } }).user.id;
    return this.projectsService.getAllProjects(Number(userId));
  }

  @Get('/:id/deployments')
  @UseGuards(AuthGuard)
  getProjectDeployments(
    @Param('id') projectId: string,
    @Req() request: Request,
  ) {
    const userId = (request as Request & { user: { id: string } }).user.id;
    return this.projectsService.getProjectDeployments(
      Number(userId),
      Number(projectId),
    );
  }
}
