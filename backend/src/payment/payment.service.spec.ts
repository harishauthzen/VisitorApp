import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PaymentService } from './payment.service.js';

describe('PaymentService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not confirm a pending registration through the demo flow in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const registrationRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 5, userId: 7, status: 'pending' }),
      update: vi.fn(),
    };
    const service = new PaymentService(registrationRepository as any);

    await expect(
      service.createPayment({ id: 5, userId: 7 } as any, 7),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(registrationRepository.update).not.toHaveBeenCalled();
  });

  it('preserves demo payment confirmation outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const registrationRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 5, userId: 7, status: 'pending' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = new PaymentService(registrationRepository as any);

    await expect(
      service.createPayment({ id: 5, userId: 7 } as any, 7),
    ).resolves.toMatchObject({
      message: 'Payment confirmed successfully',
      paymentDetails: { status: 'confirmed' },
    });
    expect(registrationRepository.update).toHaveBeenCalledWith(
      { id: 5, userId: 7 },
      { status: 'confirmed' },
    );
  });
});
