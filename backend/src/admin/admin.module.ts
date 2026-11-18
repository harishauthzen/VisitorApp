import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';

@Module({
  imports:[AuthModule,TypeOrmModule.forFeature([User]),],
  controllers: [AdminController]
})
export class AdminModule {}
