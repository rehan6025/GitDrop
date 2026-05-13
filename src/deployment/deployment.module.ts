import { Module } from '@nestjs/common';
import { DeploymentService } from './deployment.service.js';
import { DeploymentController } from './deployment.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { BullModule } from '@nestjs/bullmq';
import { DeploymentProcessor } from './deployment.processor.js';
import { SandboxModule } from '../sandbox/sandbox.module.js';
import { DeploymentGatewayModule } from './deployment-gateway.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    SandboxModule,
    DeploymentGatewayModule,
    AuthModule,
    BullModule.registerQueueAsync({
      name: 'build-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DeploymentService, DeploymentProcessor],
  controllers: [DeploymentController],
  exports: [],
})
export class DeploymentModule {}
