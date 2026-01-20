import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { GithubController } from './github/github.controller.js';
import { GithubService } from './github/github.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtModule } from '@nestjs/jwt';
import { DeploymentModule } from './deployment/deployment.module.js';
import { BullModule } from '@nestjs/bullmq';
import { SandboxController } from './sandbox/sandbox.controller';
import { SandboxService } from './sandbox/sandbox.service';
import { SandboxModule } from './sandbox/sandbox.module';

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
  ],
  controllers: [AppController, GithubController, SandboxController],
  providers: [AppService, GithubService, SandboxService],
})
export class AppModule {}
