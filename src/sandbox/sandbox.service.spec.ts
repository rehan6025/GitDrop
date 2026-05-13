import { Test, TestingModule } from '@nestjs/testing';
import { SandboxService } from './sandbox.service.js';
import { beforeEach, describe, it } from 'node:test';
import { expect } from 'vitest';

describe('SandboxService', () => {
  let service: SandboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SandboxService],
    }).compile();

    service = module.get<SandboxService>(SandboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
