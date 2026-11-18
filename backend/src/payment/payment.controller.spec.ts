import { describe, expect, it, vi } from 'vitest';
import { PaymentController } from './payment.controller.js';

describe('PaymentController', () => {
  it('delegates payment confirmation to the payment service for the authenticated user', async () => {
    const createPayment = vi.fn().mockResolvedValue({ success: true });
    const controller = new PaymentController({ createPayment } as any);
    const dto = { id: 5, userId: 7 };

    await expect(
      controller.createPayment(dto as any, { user: { id: 7 } } as any),
    ).resolves.toEqual({ success: true });
    expect(createPayment).toHaveBeenCalledWith(dto, 7);
  });
});
