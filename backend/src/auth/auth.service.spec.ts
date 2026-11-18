import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function createService(userRepository: Record<string, unknown>, otpRepository: Record<string, unknown>) {
    return new AuthService(
      {} as any,
      userRepository as any,
      otpRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  }

  it('should reject password mismatches before verifying OTP or creating an account', async () => {
    const otpService = {
      verifyOtp: vi.fn().mockResolvedValue({
        success: false,
        message: 'Invalid OTP',
      }),
    };

    const service = new AuthService(
      otpService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.verifyOtp({
      email: 'user@example.com',
      phone: '+919876543210',
      otp: '123456',
      password: 'StrongPass@123',
      confirmPassword: 'WrongPass@123',
    });

    expect(result).toEqual({
      success: false,
      message: 'Password and confirm password do not match',
    });
    expect(otpService.verifyOtp).not.toHaveBeenCalled();
  });

  it('should issue a password-reset OTP for an existing account', async () => {
    const user = { email: 'user@example.com', phone: '+919876543210' };
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(user),
    };
    const otpRepository = {
      create: vi.fn((otp) => otp),
      delete: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockImplementation(async (otp) => otp),
    };
    const service = createService(userRepository, otpRepository);

    const result = await service.forgotPassword(user.email);

    expect(result.success).toBe(true);
    expect(result.otp).toMatch(/^\d{6}$/);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: expect.objectContaining({ _type: 'ilike', _value: user.email }) },
    });
    expect(otpRepository.delete).toHaveBeenCalledWith(user);
    expect(otpRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ...user,
        otp: result.otp,
        purpose: 'password_reset',
        verified: false,
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('should report unknown accounts without creating a reset OTP', async () => {
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(null),
    };
    const otpRepository = {
      create: vi.fn(),
      delete: vi.fn(),
      save: vi.fn(),
    };
    const service = createService(userRepository, otpRepository);

    const result = await service.forgotPassword('unknown@example.com');

    expect(result).toEqual({
      success: false,
      message: 'No account found with this email address.',
    });
    expect(otpRepository.delete).not.toHaveBeenCalled();
    expect(otpRepository.save).not.toHaveBeenCalled();
  });

  it('should check that the account exists before reporting unavailable OTP delivery in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const userRepository = {
      findOne: vi.fn().mockResolvedValue({
        email: 'user@example.com',
        phone: '+919876543210',
      }),
    };
    const otpRepository = {
      save: vi.fn(),
    };
    const service = createService(userRepository, otpRepository);

    await expect(service.forgotPassword('user@example.com')).resolves.toEqual({
      success: false,
      message: 'OTP delivery is not configured',
    });
    expect(userRepository.findOne).toHaveBeenCalled();
    expect(otpRepository.save).not.toHaveBeenCalled();
  });

  it('should reject invalid password-reset codes without changing the password', async () => {
    const userRepository = {
      findOne: vi.fn().mockResolvedValue({ email: 'user@example.com' }),
      save: vi.fn(),
    };
    const otpRepository = {
      findOne: vi.fn().mockResolvedValue(null),
      delete: vi.fn(),
    };
    const service = createService(userRepository, otpRepository);

    const result = await service.resetPassword({
      email: 'user@example.com',
      otp: '123456',
      password: 'StrongPass@123',
      confirmPassword: 'StrongPass@123',
    });

    expect(result.success).toBe(false);
    expect(userRepository.save).not.toHaveBeenCalled();
    expect(otpRepository.delete).not.toHaveBeenCalled();
  });

  it('should reset the password and consume the OTP after successful verification', async () => {
    const user = { email: 'user@example.com', phone: '+919876543210', password: 'old-hash' };
    const resetOtp = {
      id: 8,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(user),
      save: vi.fn().mockImplementation(async (savedUser) => savedUser),
    };
    const otpRepository = {
      findOne: vi.fn().mockResolvedValue(resetOtp),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const service = createService(userRepository, otpRepository);

    const result = await service.resetPassword({
      email: user.email,
      otp: '123456',
      password: 'StrongPass@123',
      confirmPassword: 'StrongPass@123',
    });

    expect(result.success).toBe(true);
    expect(user.password).not.toBe('StrongPass@123');
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(otpRepository.delete).toHaveBeenCalledWith({
      id: resetOtp.id,
      verified: false,
      purpose: 'password_reset',
    });
  });
});
