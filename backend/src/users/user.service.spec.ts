import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './user.service.js';

describe('UsersService', () => {
  it('updates profile details without returning the password hash', async () => {
    const user = {
      id: 4,
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'stored-hash',
      firstName: 'Ada',
      lastName: 'Lovelace',
      gender: 'Female',
      city: 'London',
      company: 'Analytical Engines',
    };
    const userRepository = {
      findOne: vi.fn().mockResolvedValue(user),
      save: vi.fn().mockImplementation(async (value) => value),
    };
    const service = new UsersService(userRepository as any, {} as any);

    const result = await service.addDetails(4, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      gender: 'Female',
      city: 'London',
      company: 'Analytical Engines',
    });

    expect(result).toEqual({
      id: 4,
      email: 'user@example.com',
      phone: '+1234567890',
      firstName: 'Ada',
      lastName: 'Lovelace',
      gender: 'Female',
      city: 'London',
      company: 'Analytical Engines',
    });
    expect(result).not.toHaveProperty('password');
  });
});
