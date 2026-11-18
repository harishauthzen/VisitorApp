import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AdminController } from './admin.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guards.js';
import { AdminAuthGuard } from '../auth/guards/admin-guards.js';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should only require the admin JWT guard', () => {
    const guards = Reflect.getMetadata('__guards__', AdminController) ?? [];

    expect(guards).toContain(AdminAuthGuard);
    expect(guards).not.toContain(JwtAuthGuard);
  });
});
