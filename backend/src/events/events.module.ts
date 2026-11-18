import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { EventController } from './event.controller.js';
import { EventService } from './event.service.js';
import { EventEntity } from './event.entity.js';
import { EventPass } from './event-pass.entity.js';
import { EventRegistration } from './event-registration.entity.js';
import { AdminJwtStrategy } from '../auth/strategies/jtw-strategies.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity, EventPass, EventRegistration]),
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
  ],
  controllers: [EventController],
  providers: [EventService, AdminJwtStrategy],
  exports: [EventService],
})
export class EventsModule {}
