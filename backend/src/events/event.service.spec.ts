import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';

describe('EventService', () => {
  it('returns empty collections for trash endpoints when no records are deleted', async () => {
    const eventRepo = { find: vi.fn().mockResolvedValue([]) };
    const passRepo = { find: vi.fn().mockResolvedValue([]) };
    const registrationRepo = { find: vi.fn().mockResolvedValue([]) };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    await expect(service.getAllDeletedEvents()).resolves.toEqual([]);
    await expect(service.getDeletedPasses()).resolves.toEqual([]);
    await expect(service.getAllDeletedRegistrations()).resolves.toEqual([]);
  });

  it('should deactivate active events whose end time has passed', async () => {
    const eventRepo = {
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      find: vi.fn().mockResolvedValue([]),
    };
    const service = new EventService(
      {} as any,
      {} as any,
      {} as any,
      eventRepo as any,
    );

    await expect(service.getEvents()).resolves.toEqual([]);

    const [criteria, update] = eventRepo.update.mock.calls[0];
    expect(criteria.isActive).toBe(true);
    expect(criteria.endDate.type).toBe('lessThanOrEqual');
    expect(criteria.endDate.value).toBeInstanceOf(Date);
    expect(update).toEqual({ isActive: false });
  });

  it('should reactivate an inactive event when an admin moves its end time into the future', async () => {
    const eventRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 7,
        startDate: '2020-01-01T00:00:00.000Z',
        endDate: '2020-01-02T00:00:00.000Z',
        isActive: false,
      }),
      save: vi.fn().mockImplementation(async (event) => ({ ...event })),
    };
    const service = new EventService(
      {} as any,
      {} as any,
      {} as any,
      eventRepo as any,
    );

    await expect(
      service.updateEvent(7, {
        startDate: '2099-01-01T00:00:00.000Z',
        endDate: '2099-01-02T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({ isActive: true });
  });

  it('should count only confirmed registrations toward dashboard revenue', async () => {
    const revenueQuery = {
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue({ totalRevenue: '1250' }),
    };
    const eventRepo = {
      update: vi.fn().mockResolvedValue({ affected: 0 }),
      find: vi.fn().mockResolvedValue([]),
    };
    const passRepo = {
      count: vi.fn().mockResolvedValue(0),
      createQueryBuilder: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValue({ totalSoldSlots: '0' }),
      }),
    };
    const registrationRepo = {
      count: vi.fn().mockResolvedValue(2),
      createQueryBuilder: vi.fn().mockReturnValue(revenueQuery),
    };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    await expect(service.getAdminDashboardSummary()).resolves.toMatchObject({
      totalRegistrations: 2,
      totalRevenue: 1250,
    });
    expect(revenueQuery.where).toHaveBeenCalledWith(
      'registration.status = :status',
      { status: 'confirmed' },
    );
  });

  it('should register attendee when passes are available', async () => {
    const passRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Premium',
        totalSlots: 100,
        soldSlots: 20,
        price: 1500,
        event: { id: 7 },
      }),
      save: vi.fn().mockImplementation(async (pass) => ({ ...pass })),
    };

    const registrationRepo = {
      create: vi.fn((data) => data),
      save: vi.fn().mockImplementation(async (data) => ({ ...data, id: 9 })),
    };

    const eventRepo = {
      update: vi.fn().mockResolvedValue({ affected: 0 }),
      findOne: vi.fn().mockResolvedValue({
        id: 7,
        name: 'Event',
        isActive: true,
        startDate: '2099-09-10T00:00:00.000Z',
        endDate: '2099-09-15T23:59:59.000Z',
      }),
    };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    const registration = await service.createRegistration({
      eventId: 7,
      passId: 1,
      attendeeName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      quantity: 5,
      selectedDate: '2026-09-12',
    },1);

    expect(registration.quantity).toBe(5);
    expect(passRepo.save).toHaveBeenCalled();
    expect(registrationRepo.save).toHaveBeenCalled();
  });

  it('should reject registration when requested slots exceed available capacity', async () => {
    const passRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Basic',
        totalSlots: 10,
        soldSlots: 8,
        price: 500,
        event: { id: 2 },
      }),
      save: vi.fn().mockImplementation(async (pass) => ({ ...pass })),
    };

    const registrationRepo = {
      create: vi.fn((data) => data),
      save: vi.fn(),
    };

    const eventRepo = {
      update: vi.fn().mockResolvedValue({ affected: 0 }),
      findOne: vi.fn().mockResolvedValue({
        id: 2,
        name: 'Event',
        isActive: true,
        startDate: '2099-09-10T00:00:00.000Z',
        endDate: '2099-09-15T23:59:59.000Z',
      }),
    };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    await expect(
      service.createRegistration({
        eventId: 2,
        passId: 1,
        attendeeName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1987654321',
        quantity: 5,
        selectedDate: '2026-09-12',
      },1),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject registration dates outside the event date range', async () => {
    const passRepo = {
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Standard',
        totalSlots: 50,
        soldSlots: 5,
        price: 1000,
        event: {
          id: 8,
          startDate: '2026-09-10T00:00:00.000Z',
          endDate: '2026-09-15T23:59:59.000Z',
        },
      }),
      save: vi.fn().mockImplementation(async (pass) => ({ ...pass })),
    };

    const registrationRepo = {
      create: vi.fn((data) => data),
      save: vi.fn().mockImplementation(async (data) => ({ ...data, id: 10 })),
    };

    const eventRepo = {
      update: vi.fn().mockResolvedValue({ affected: 0 }),
      findOne: vi.fn().mockResolvedValue({
        id: 8,
        name: 'Event',
        isActive: true,
        startDate: '2026-09-10T00:00:00.000Z',
        endDate: '2026-09-15T23:59:59.000Z',
      }),
    };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    await expect(
      service.createRegistration({
        eventId: 8,
        passId: 1,
        attendeeName: 'Valid Day',
        email: 'valid@example.com',
        quantity: 1,
        selectedDate: '2026-09-12',
      },1),
    ).resolves.toMatchObject({ selectedDate: '2026-09-12' });

    await expect(
      service.createRegistration({
        eventId: 8,
        passId: 1,
        attendeeName: 'Invalid Day',
        email: 'invalid@example.com',
        quantity: 1,
        selectedDate: '2026-09-16',
      },1),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow a valid user to register a different attendee email or phone and admin payloads should pass through', async () => {
    const createRegistration = vi.fn().mockResolvedValue({ id: 77 });
    const controller = new EventController({ createRegistration } as any);

    await expect(
      controller.createRegistration(
        {
          user: { id: 10, email: 'me@example.com', phone: '+15550000000', type: 'USER', role: 'user' },
        } as any,
        5,
        {
          attendeeName: 'Guest User',
          email: 'guest@example.com',
          phone: '+15550001111',
          quantity: 2,
          passId: 1,
          selectedDate: '2026-09-12',
        },
      ),
    ).resolves.toEqual({ id: 77 });

    await expect(
      controller.createRegistration(
        {
          user: { id: 99, email: 'admin@example.com', type: 'ADMIN', role: 'admin' },
        } as any,
        5,
        {
          attendeeName: 'Admin Registration',
          email: 'admin-attendee@example.com',
          quantity: 1,
          passId: 2,
          selectedDate: '2026-09-13',
        },
      ),
    ).resolves.toEqual({ id: 77 });

    expect(createRegistration).toHaveBeenCalledTimes(2);
  });

  it('should update an event and a pass by id for admin management', async () => {
    const eventRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 7, name: 'Old Name' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      save: vi.fn().mockImplementation(async (event) => ({ ...event })),
    };

    const passRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 3, eventId: 7, name: 'Old Pass' }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      save: vi.fn().mockImplementation(async (pass) => ({ ...pass })),
    };

    const registrationRepo = { create: vi.fn(), save: vi.fn() };
    const service = new EventService(
      {} as any,
      passRepo as any,
      registrationRepo as any,
      eventRepo as any,
    );

    await expect(service.updateEvent(7, { name: 'New Name' })).resolves.toMatchObject({ id: 7, name: 'New Name' });
    await expect(service.updatePass(7, 3, { name: 'Updated Pass' })).resolves.toMatchObject({ id: 3, eventId: 7, name: 'Updated Pass' });
    await expect(service.deleteEvent(7)).resolves.toEqual({ deleted: true });
    await expect(service.deletePass(7, 3)).resolves.toEqual({ deleted: true });
  });

  it('rejects QR check-in for registrations that are not confirmed', async () => {
    const registration = {
      qrToken: 'pending-token',
      selectedDate: '2099-12-31',
      status: 'pending',
      isCheckedIn: false,
    };
    const registrationRepo = {
      findOne: vi.fn().mockResolvedValue(registration),
      save: vi.fn(),
    };
    const service = new EventService(
      {} as any,
      {} as any,
      registrationRepo as any,
      {} as any,
    );

    await expect(
      service.verifyQr('pending-token', 1),
    ).rejects.toThrow(BadRequestException);
    expect(registrationRepo.save).not.toHaveBeenCalled();
  });

  it('continues to check in confirmed registrations', async () => {
    const registration = {
      qrToken: 'confirmed-token',
      selectedDate: '2099-12-31',
      status: 'confirmed',
      isCheckedIn: false,
      scanCount: 0,
      attendeeName: 'Visitor',
      quantity: 1,
    };
    const registrationRepo = {
      findOne: vi.fn().mockResolvedValue(registration),
      save: vi.fn().mockImplementation(async (value) => value),
    };
    const service = new EventService(
      {} as any,
      {} as any,
      registrationRepo as any,
      {} as any,
    );

    await expect(
      service.verifyQr('confirmed-token', 1),
    ).resolves.toMatchObject({ valid: true, status: 'confirmed' });
    expect(registrationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isCheckedIn: true, scanCount: 1 }),
    );
  });
});
