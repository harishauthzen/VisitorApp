import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRegistration } from '../events/event-registration.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([EventRegistration])],
  controllers: [PaymentController],
  providers: [PaymentService]
})
export class PaymentModule {}
