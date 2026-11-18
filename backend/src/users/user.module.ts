import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity.js';
import { UsersService } from './user.service.js';
import { UsersController } from './user.controller.js';
import { Otp } from '../otp/otp.entity.js';
import { EventRegistration } from '../events/event-registration.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EventRegistration, Otp]),
  ],
  controllers : [UsersController],
  providers:[UsersService],
  exports:[UsersService]
})
export class UsersModule {}