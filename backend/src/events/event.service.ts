import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto.js';
import { CreateEventPassDto } from './dto/create-event-pass.dto.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { EventEntity } from './event.entity.js';
import { EventPass } from './event-pass.entity.js';
import { EventRegistration } from './event-registration.entity.js';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

@Injectable()
export class EventService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(EventPass)
    private readonly passRepository: Repository<EventPass>,
    @InjectRepository(EventRegistration)
    private readonly registrationRepository: Repository<EventRegistration>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
  ) { }

  async createEvent(dto: CreateEventDto): Promise<EventEntity> {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Start and end dates must be valid timestamps');
    }

    if (start < new Date()) {
      throw new BadRequestException('Start time should be greater than current time');
    }

    if (end <= start) {
      throw new BadRequestException('End time should be greater than start time');
    }

    const event = this.eventRepository.create(dto);
    event.isActive = end > new Date();

    return this.eventRepository.save(event);
  }

  async getEvents() {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    await this.deactivateExpiredEvents();
    const allEvents = await this.eventRepository.find({ relations: { passes: true } as any });

    const events = allEvents.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      isActive: event.isActive,
    }));

    return events;
  }

  async getAllDeletedEvents() {
    const allDeletedEvents = await this.eventRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
      relations: {
        passes: true,
      },
      order: {
        deletedAt: 'DESC',
      },
    });

    return allDeletedEvents.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate,
      isActive: event.isActive,
      deletedAt: event.deletedAt,
    }));
  }

  async getEventById(id: number) {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    await this.deactivateExpiredEvents();
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: { passes: true } as any,
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async createPass(eventId: number, dto: CreateEventPassDto): Promise<EventPass> {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    const event = await this.eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const pass = this.passRepository.create({
      ...dto,
      event,
      eventId,
    });

    return this.passRepository.save(pass);
  }

  async deleteEvent(id: number): Promise<{ deleted: true }> {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    const result = await this.eventRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Event not found');
    }

    return { deleted: true };
  }

  async updateEvent(id: number, dto: Partial<CreateEventDto>): Promise<EventEntity> {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    Object.assign(event, dto);

    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException('Start and end dates must be valid timestamps');
      }

      if (end <= start) {
        throw new BadRequestException('End time must be after start time');
      }

      event.isActive = end > new Date();
    }

    return this.eventRepository.save(event);
  }

  async getPasses(eventId: number): Promise<EventPass[]> {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    const event = await this.eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const passes = await this.passRepository.find({ where: { eventId } });
    return passes;
  }

  async getDeletedPasses() {
    const deletedPasses = await this.passRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
      relations: {
        event: true,
      },
      order: {
        deletedAt: 'DESC',
      },
    });

    return deletedPasses.map((pass) => ({
      id: pass.id,
      name: pass.name,
      description: pass.description,
      price: pass.price,
      totalSlots: pass.totalSlots,
      soldSlots: pass.soldSlots,
      eventId: pass.eventId,
      eventName: pass.event?.name ?? 'Deleted event',
      deletedAt: pass.deletedAt,
      deletedWithEvent: pass.deletedWithEvent,
      deletionType: pass.deletedWithEvent
        ? 'event'
        : 'individual',
    }));
  }

  async updatePass(eventId: number, passId: number, dto: Partial<CreateEventPassDto>): Promise<EventPass> {
    const pass = await this.passRepository.findOne({
      where: { id: passId, eventId },
      relations: { event: true } as any,
    });

    if (!pass) {
      throw new NotFoundException('Pass not found for this event');
    }

    Object.assign(pass, dto);
    return this.passRepository.save(pass);
  }

  async deletePass(eventId: number, passId: number): Promise<{ deleted: true }> {
    const result = await this.passRepository.delete({ id: passId, eventId });

    if (result.affected === 0) {
      throw new NotFoundException('Pass not found for this event');
    }

    return { deleted: true };
  }

  async findRegistrationsByEvent(eventId: number) {
    const registrationData = await this.registrationRepository.find({
      where: { eventId },
      relations: { event: true, pass: true } as any,
      order: { createdAt: 'DESC' },
    });

    const deletedPasses = await this.passRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
    const deletedPassById = new Map(
      deletedPasses.map((pass) => [pass.id, pass]),
    );

    // const event = registrationData.map((registration) => ({
    //   attendeeName: registration.attendeeName,
    //   email: registration.email,
    //   phone: registration.phone,
    //   quantity: registration.quantity,
    //   status: registration.status,
    //   pass: {
    //     name: registration.pass.name,
    //   }
    // }));

    return registrationData.map((registration) => ({
      id: registration.id,
      attendeeName: registration.attendeeName,
      email: registration.email,
      phone: registration.phone,
      quantity: registration.quantity,
      status: registration.status,
      createdAt: registration.createdAt,
      selectedDate: registration.selectedDate,
      amount: registration.amount,
      passName:
        (registration.passNameSnapshot &&
          registration.passNameSnapshot !== 'Deleted pass'
          ? registration.passNameSnapshot
          : undefined) ??
        (registration.pass?.name !== 'Deleted pass'
          ? registration.pass?.name
          : undefined) ??
        (registration.passId
          ? deletedPassById.get(registration.passId)?.name
          : undefined) ??
        'Deleted pass',
      passPrice:
        registration.passPriceSnapshot ??
        registration.pass?.price ??
        (registration.passId
          ? deletedPassById.get(registration.passId)?.price
          : undefined),
      eventNameSnapshot: registration.eventNameSnapshot,
      passNameSnapshot: registration.passNameSnapshot,
      passPriceSnapshot: registration.passPriceSnapshot,
      event: registration.event
        ? {
          id: registration.event.id,
          name: registration.eventNameSnapshot ??
            registration.event?.name ??
            'Deleted event',
        }
        : {
          id: null,
          name: registration.eventNameSnapshot ?? 'Deleted event',
        },
      pass: registration.pass
        ? {
          id: registration.pass.id,
          name: (registration.passNameSnapshot !== 'Deleted pass'
            ? registration.passNameSnapshot
            : null) ??
            registration.pass?.name ??
            (registration.passId ? deletedPassById.get(registration.passId)?.name : undefined) ??
            'Deleted pass',
          price: registration.passPriceSnapshot ??
            registration.pass.price ??
            (registration.passId ? deletedPassById.get(registration.passId)?.price : undefined),
        }
        : {
          id: null,
          name: (registration.passNameSnapshot !== 'Deleted pass'
            ? registration.passNameSnapshot
            : null) ??
            (registration.passId ? deletedPassById.get(registration.passId)?.name : undefined) ??
            'Deleted pass',
          price: registration.passPriceSnapshot ??
            (registration.passId ? deletedPassById.get(registration.passId)?.price : undefined),
        },
    }));

  }

  async getAdminDashboardSummary() {
    if (!this.eventRepository) {
      throw new Error('Event repository is not configured');
    }

    await this.deactivateExpiredEvents();
    const [events, passCount, soldSlots, registrationCount, revenue] = await Promise.all([
      this.eventRepository.find({ relations: { passes: true } as any }),
      this.passRepository.count(),
      this.passRepository
        .createQueryBuilder('pass')
        .select('SUM(pass.soldSlots)', 'totalSoldSlots')
        .getRawOne(),
      this.registrationRepository.count(),
      this.registrationRepository
        .createQueryBuilder('registration')
        .select('SUM(registration.amount)', 'totalRevenue')
        .where('registration.status = :status', { status: 'confirmed' })
        .getRawOne(),
    ]);

    const totalEventRevenue = Number(revenue?.totalRevenue ?? 0);
    const totalSoldSlots = Number(soldSlots?.totalSoldSlots ?? 0);

    return {
      totalEvents: events.length,
      totalPasses: passCount,
      totalSoldSlots,
      totalRegistrations: registrationCount,
      totalRevenue: totalEventRevenue,
      upcomingEvents: events.filter((event) => new Date(event.startDate) > new Date()).length,
      activeEvents: events.filter((event) => event.isActive).length,
    };
  }

  async createRegistration(dto: CreateRegistrationDto & { eventId: number }, userId: number): Promise<EventRegistration> {

    if (!userId) {
      throw new BadRequestException('User ID is required for registration');
    }

    const pass = await this.passRepository.findOne({
      where: { id: dto.passId, event: { id: dto.eventId } },
      relations: { event: true } as any,
    });

    if (!pass) {
      throw new NotFoundException('Pass not found for this event');
    }

    const event = await this.getEventById(dto.eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.isActive === false) {
      throw new BadRequestException('Event is not active for registration');
    }

    const selectedDate = new Date(dto.selectedDate);
    const eventStartDate = new Date(pass.event.startDate);
    const eventEndDate = new Date(pass.event.endDate);

    if (Number.isNaN(selectedDate.getTime())) {
      throw new BadRequestException('Selected registration date must be valid');
    }

    const normalizeDate = (date: Date) =>
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
      );

    const selected = normalizeDate(selectedDate);
    const start = normalizeDate(eventStartDate);
    const end = normalizeDate(eventEndDate);

    if (selected < start || selected > end) {
      throw new BadRequestException(
        'Selected registration date must be between the event start and end date',
      );
    }

    if (dto.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const remainingSlots = pass.totalSlots - pass.soldSlots;

    if (dto.quantity > remainingSlots) {
      throw new BadRequestException(`Only ${remainingSlots} slots left for ${pass.name}`);
    }

    pass.soldSlots += dto.quantity;
    await this.passRepository.save(pass);

    const registration = this.registrationRepository.create({
      ...dto,
      userId,

      selectedDate: dto.selectedDate,
      amount: Number(pass.price) * dto.quantity,
      eventId: event.id,
      event,
      passId: pass.id,
      pass,

      eventNameSnapshot: event.name,
      passNameSnapshot: pass.name,
      passPriceSnapshot: String(pass.price),
      qrToken: randomUUID()
    });

    return this.registrationRepository.save(registration);
  }

  async getAllRegistrations() {
    const registrations = await this.registrationRepository.find({
      relations: { event: true, pass: true } as any,
      order: { createdAt: 'DESC' },
    });

    const deletedPasses = await this.passRepository.find({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
    });
    const deletedPassById = new Map(
      deletedPasses.map((pass) => [pass.id, pass]),
    );

    const registrationData = registrations.map((registration) => ({
      id: registration.id,
      attendeeName: registration.attendeeName,
      email: registration.email,
      quantity: registration.quantity,
      selectedDate: registration.selectedDate,
      createdAt: registration.createdAt,
      amount: registration.amount,
      passName:
        (registration.passNameSnapshot &&
          registration.passNameSnapshot !== 'Deleted pass'
          ? registration.passNameSnapshot
          : undefined) ??
        (registration.pass?.name !== 'Deleted pass'
          ? registration.pass?.name
          : undefined) ??
        (registration.passId
          ? deletedPassById.get(registration.passId)?.name
          : undefined) ??
        'Deleted pass',
      passPrice:
        registration.passPriceSnapshot ??
        registration.pass?.price ??
        (registration.passId
          ? deletedPassById.get(registration.passId)?.price
          : undefined),
      eventNameSnapshot: registration.eventNameSnapshot,
      passNameSnapshot: registration.passNameSnapshot,
      passPriceSnapshot: registration.passPriceSnapshot,
      event: {
        name: registration.eventNameSnapshot ??
          registration.event?.name ??
          'Deleted event',
      },
      pass: {
        name: (registration.passNameSnapshot !== 'Deleted pass'
          ? registration.passNameSnapshot
          : null) ??
          registration.pass?.name ??
          (registration.passId ? deletedPassById.get(registration.passId)?.name : undefined) ??
          'Deleted pass',
        price: registration.passPriceSnapshot ??
          registration.pass?.price ??
          (registration.passId ? deletedPassById.get(registration.passId)?.price : undefined),
      },
      status: registration.status,
    }));

    return registrationData;
  }

  async getAllDeletedRegistrations() {
    const registrations = await this.registrationRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
      relations: {
        event: true,
        pass: true,
      },
      order: {
        deletedAt: 'DESC',
      },
    });

    return registrations.map((registration) => ({
      id: registration.id,
      attendeeName: registration.attendeeName,
      eventName:
        registration.eventNameSnapshot ??
        registration.event?.name ??
        'Deleted event',
      passName:
        (registration.passNameSnapshot !== 'Deleted pass'
          ? registration.passNameSnapshot
          : null) ??
        registration.pass?.name ??
        'Deleted pass',
      passPrice:
        registration.passPriceSnapshot ??
        registration.pass?.price,
      amount: registration.amount,
      quantity: registration.quantity,
      deletedAt: registration.deletedAt,
    }));
  }

  async verifyQr(qrToken: string, userId: number) {
    if (!qrToken) {
      throw new BadRequestException(
        'QR token is required',
      );
    }

    const registration = await this.registrationRepository.findOne({
      where: {
        qrToken,
      },
      relations: {
        event: true,
        pass: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        'Invalid QR code',
      );
    }

    if (registration.status !== 'confirmed') {
      throw new BadRequestException('Registration is not confirmed');
    }

    const selectedDate = new Date(registration.selectedDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      throw new NotFoundException('Pass expired');
    }

    if (registration.isCheckedIn) {

      registration.scanCount = (registration.scanCount ?? 0) + 1;
      await this.registrationRepository.save(registration);

      return {
        valid: false,
        repeated: true,
        attendeeName: registration.attendeeName,
        event: registration.event?.name ??
          registration.eventNameSnapshot ??
          'Deleted event',
        pass: registration.pass?.name ??
          registration.passNameSnapshot ??
          'Deleted pass',
        quantity: registration.quantity,
        selectedDate: registration.selectedDate,
        scanCount: registration.scanCount,
        status: registration.status,
      }
    }

    registration.isCheckedIn = true;
    registration.scanCount = (registration.scanCount ?? 0) + 1;
    await this.registrationRepository.save(registration);

    return {
      valid: true,
      attendeeName: registration.attendeeName,
      event: registration.event?.name ??
        registration.eventNameSnapshot ??
        'Deleted event',
      pass: registration.pass?.name ??
        registration.passNameSnapshot ??
        'Deleted pass',
      quantity: registration.quantity,
      selectedDate: registration.selectedDate,
      scanCount: registration.scanCount,
      status: registration.status
    };
  }

  async scanCount() {
    const registrations = await this.registrationRepository.find({});

    if (!registrations || registrations.length === 0) {
      throw new NotFoundException('No registrations found');
    }

    const totalScanCount = registrations.reduce(
      (total, registration) => total + (registration.scanCount ?? 0),
      0
    )

    return {
      totalScanCount
    }

  }

  async getRegistrationById(id: number) {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      relations: { event: true, pass: true } as any,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    return {
      ...registration,
      event: registration.event
        ? {
          id: registration.event.id,
          name: registration.eventNameSnapshot ??
            registration.event.name ??
            'Deleted event',
          location: registration.event.location,
          startDate: registration.event.startDate,
          endDate: registration.event.endDate,
        }
        : {
          id: null,
          name: registration.eventNameSnapshot ?? 'Deleted event',
        },
      pass: registration.pass
        ? {
          id: registration.pass.id,
          name: (registration.passNameSnapshot !== 'Deleted pass'
            ? registration.passNameSnapshot
            : null) ??
            registration.pass.name ??
            'Deleted pass',
          price: registration.passPriceSnapshot ??
            registration.pass.price,
        }
        : {
          id: null,
          name: (registration.passNameSnapshot !== 'Deleted pass'
            ? registration.passNameSnapshot
            : null) ?? 'Deleted pass',
          price: registration.passPriceSnapshot,
        },
    };
  }

  async softDeleteEvent(id: number): Promise<{ deleted: true }> {
    await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(EventEntity);
      const passRepo = manager.getRepository(EventPass);

      const event = await eventRepo.findOne({
        where: { id },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const activePasses = await passRepo.find({
        where: { eventId: id },
      });

      const registrationRepo = manager.getRepository(EventRegistration);
      const registrations = await registrationRepo.find({
        where: { eventId: id },
        withDeleted: true,
      });
      const passById = new Map(activePasses.map((pass) => [pass.id, pass]));

      for (const registration of registrations) {
        if (!registration.eventNameSnapshot || registration.eventNameSnapshot === 'Deleted event') {
          registration.eventNameSnapshot = event.name;
        }
        const pass = registration.passId
          ? passById.get(registration.passId)
          : undefined;
        if (pass) {
          if (!registration.passNameSnapshot || registration.passNameSnapshot === 'Deleted pass') {
            registration.passNameSnapshot = pass.name;
          }
          registration.passPriceSnapshot ??= String(pass.price);
        }
      }

      if (registrations.length > 0) {
        await registrationRepo.save(registrations);
      }

      for (const pass of activePasses) {
        pass.deletedWithEvent = true;
      }

      if (activePasses.length > 0) {
        await passRepo.save(activePasses);

        for (const pass of activePasses) {
          await passRepo.softDelete(pass.id);
        }
      }

      await eventRepo.softDelete(id);
    });

    return {
      deleted: true
    }
  }

  async restoreEvent(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(EventEntity);
      const passRepo = manager.getRepository(EventPass);

      const event = await eventRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (!event.deletedAt) {
        throw new BadRequestException('Event is not deleted');
      }

      await eventRepo.restore(id);

      const deletedPasses = await passRepo.find({
        where: {
          eventId: id,
          deletedWithEvent: true,
        },
        withDeleted: true,
      });

      for (const pass of deletedPasses) {
        await passRepo.restore(pass.id);
        await passRepo.update(pass.id, {
          deletedWithEvent: false,
        });
      }
    });
  }

  async permanentlyDeleteEvent(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const eventRepo = manager.getRepository(EventEntity);
      const passRepo = manager.getRepository(EventPass);
      const registrationRepo =
        manager.getRepository(EventRegistration);

      const event = await eventRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const passes = await passRepo.find({
        where: { eventId: id },
        withDeleted: true,
      });

      const passById = new Map(
        passes.map((pass) => [pass.id, pass]),
      );

      const registrations = await registrationRepo
        .createQueryBuilder('registration')
        .withDeleted()
        .where('registration.eventId = :id', { id })
        .orWhere('registration.passId IN (:...passIds)', {
          passIds: passes.length > 0
            ? passes.map((pass) => pass.id)
            : [-1],
        })
        .getMany();

      for (const registration of registrations) {
        if (!registration.eventNameSnapshot || registration.eventNameSnapshot === 'Deleted event') {
          registration.eventNameSnapshot = event.name;
        }

        const pass = registration.passId
          ? passById.get(registration.passId)
          : undefined;

        if (pass) {
          if (!registration.passNameSnapshot || registration.passNameSnapshot === 'Deleted pass') {
            registration.passNameSnapshot = pass.name;
          }
          registration.passPriceSnapshot ??= String(pass.price);
        }

        registration.eventId = null;
        registration.event = null;
        registration.passId = null;
        registration.pass = null;
      }

      if (registrations.length > 0) {
        await registrationRepo.save(registrations);
      }

      // The database CASCADE removes the event's passes.
      await eventRepo.delete(id);
    });
  }


  async softDeletePass(id: number): Promise<{ deleted: true }> {
    await this.dataSource.transaction(async (manager) => {
      const passRepo = manager.getRepository(EventPass);
      const registrationRepo = manager.getRepository(EventRegistration);
      const pass = await passRepo.findOne({
        where: { id },
      });

      if (!pass) {
        throw new NotFoundException('Pass not found');
      }

      const registrations = await registrationRepo.find({
        where: { passId: id },
        withDeleted: true,
      });

      for (const registration of registrations) {
        if (!registration.passNameSnapshot || registration.passNameSnapshot === 'Deleted pass') {
          registration.passNameSnapshot = pass.name;
        }
        registration.passPriceSnapshot ??= String(pass.price);
      }

      if (registrations.length > 0) {
        await registrationRepo.save(registrations);
      }

      await passRepo.softDelete(id);
    });

    return {
      deleted: true
    }
  }

  async restorePass(id: number): Promise<void> {
    const pass = await this.passRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!pass) {
      throw new NotFoundException('Pass not found');
    }

    if (!pass.deletedAt) {
      throw new BadRequestException('Pass is not deleted');
    }

    const event = await this.eventRepository.findOne({
      where: { id: pass.eventId },
    });

    if (!event) {
      throw new BadRequestException(
        'Cannot restore pass because its event is deleted',
      );
    }

    await this.passRepository.restore(id);

    await this.passRepository.update(id, {
      deletedWithEvent: false,
    });
  }

  async permanentlyDeletePass(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const passRepo = manager.getRepository(EventPass);
      const registrationRepo =
        manager.getRepository(EventRegistration);

      const pass = await passRepo.findOne({
        where: { id },
        withDeleted: true,
      });

      if (!pass) {
        throw new NotFoundException('Pass not found');
      }

      const registrations = await registrationRepo.find({
        where: { passId: id },
        withDeleted: true,
      });

      for (const registration of registrations) {
        if (!registration.passNameSnapshot || registration.passNameSnapshot === 'Deleted pass') {
          registration.passNameSnapshot = pass.name;
        }
        registration.passPriceSnapshot ??= String(pass.price);
        registration.passId = null;
        registration.pass = null;
      }

      if (registrations.length > 0) {
        await registrationRepo.save(registrations);
      }

      await passRepo.delete(id);
    });
  }


  async softDeleteRegistration(id: number): Promise<{ deleted: true }> {
    const result = await this.registrationRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Registration not found');
    }

    return {
      deleted: true
    }
  }

  async restoreRegistration(id: number): Promise<void> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (!registration.deletedAt) {
      throw new BadRequestException('Registration is not deleted');
    }

    await this.registrationRepository.restore(id);
  }

  async permanentlyDeleteRegistration(id: number): Promise<void> {
    const registration = await this.registrationRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.registrationRepository.delete(id);
  }


  private async deactivateExpiredEvents(): Promise<void> {
    await this.eventRepository!.update(
      { endDate: LessThanOrEqual(new Date()), isActive: true },
      { isActive: false },
    );
  }
}
