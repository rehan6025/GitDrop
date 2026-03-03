import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProjects(userId: number) {
    try {
      const data = this.prisma.projects.findMany({
        where: {
          user_id: userId,
        },
      });

      return data;
    } catch (error) {
      console.log('ProjectService :: getallProjects  :: ', error);
      throw new NotFoundException("Coudn't fetch projects");
    }
  }

  async getProjectDeployments(userId: number, projectId: number) {
    try {
      const data = this.prisma.deployments.findMany({
        where: {
          project_id: projectId,
        },
      });

      return data;
    } catch (error) {
      console.log('ProjectService :: getallProjects  :: ', error);
      throw new NotFoundException("Coudn't fetch projects");
    }
  }
}
