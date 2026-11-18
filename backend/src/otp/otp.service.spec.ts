import { afterEach, describe, it, expect, vi } from 'vitest';
import { OtpService } from './otp.service.js';

describe('OtpService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should delete previous OTP rows and save only one new OTP for the same email and phone', async () => {
    const otpRepository = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation(async (otp) => otp),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    const service = new OtpService(
      otpRepository as any,
      userRepository as any,
      {} as any,
    );

    const result = await service.sendOtp('user@example.com', '+1234567890');

    expect(result.success).toBe(true);
    expect(otpRepository.delete).toHaveBeenCalledWith({
      email: 'user@example.com',
      phone: '+1234567890',
    });
    expect(otpRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        phone: '+1234567890',
        otp: expect.stringMatching(/^\d{6}$/),
        verified: false,
      }),
    );
    expect(result.otp).toMatch(/^\d{6}$/);
  });

  it('does not create or disclose OTPs in production without a delivery provider', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const otpRepository = {
      delete: vi.fn(),
      save: vi.fn(),
    };
    const userRepository = {
      findOne: vi.fn(),
    };
    const service = new OtpService(
      otpRepository as any,
      userRepository as any,
      {} as any,
    );

    await expect(
      service.sendOtp('user@example.com', '+1234567890'),
    ).resolves.toEqual({
      success: false,
      message: 'OTP delivery is not configured',
    });
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(otpRepository.save).not.toHaveBeenCalled();
  });

  it('does not mark either contact method verified from the development OTP flow', async () => {
    const otp = {
      email: 'user@example.com',
      phone: '+1234567890',
      otp: '123456',
      verified: false,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const otpRepository = {
      findOne: vi.fn().mockResolvedValue(otp),
      save: vi.fn().mockImplementation(async (value) => value),
    };
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((value) => value),
      save: vi.fn().mockImplementation(async (value) => ({ ...value, id: 1 })),
    };
    const service = new OtpService(
      otpRepository as any,
      userRepository as any,
      { generateToken: vi.fn().mockResolvedValue('register-token') } as any,
    );

    const result = await service.verifyOtp({
      email: otp.email,
      phone: otp.phone,
      otp: otp.otp,
      password: 'StrongPass@123',
    } as any);

    expect(result.success).toBe(true);
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerified: false,
        phoneVerified: false,
      }),
    );
  });
});
