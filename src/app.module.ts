import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtModule } from '@nestjs/jwt';
import { DeploymentModule } from './deployment/deployment.module.js';
import { BullModule } from '@nestjs/bullmq';
import { SandboxModule } from './sandbox/sandbox.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { GithubModule } from './github/github.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    JwtModule,
    DeploymentModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    SandboxModule,
    ProjectsModule,
    GithubModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
