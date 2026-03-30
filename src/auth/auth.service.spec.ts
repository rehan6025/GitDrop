import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // Mocking EVERY dependency so the sandbox is "Full"
        { provide: ConfigService, useValue: { get: vi.fn() } },
        { provide: PrismaService, useValue: { user: { findUnique: vi.fn() } } },
        { provide: JwtService, useValue: { sign: vi.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});