import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Otp } from './otp.entity.js';
import { OtpService } from './otp.service.js';
import { CustomJwtModule } from '../jwt/jwt.module.js';
import { User } from '../users/user.entity.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([Otp,User]),
    CustomJwtModule
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule { }
