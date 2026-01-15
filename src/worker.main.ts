// src/worker.main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
  console.log('Worker started');
}
bootstrap();
