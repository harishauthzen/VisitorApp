import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OtpModule } from "../otp/otp.module.js";
import { User } from "../users/user.entity.js";
import { UsersModule } from "../users/user.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

import { PassportModule } from "@nestjs/passport";
import { Otp } from "../otp/otp.entity.js";
import { CustomJwtModule } from '../jwt/jwt.module.js';
import { RegisterGuard } from './guards/register.guards.js';
import { AdminJwtStrategy, UserJwtStrategy } from './strategies/jtw-strategies.js';
import { CommonModule } from "../common/common.module.js";
import { OvseVerification } from "../common/services/ovse.entity.js";



@Module({
    imports: [
        OtpModule,
        TypeOrmModule.forFeature([User, Otp , OvseVerification]),
        UsersModule,
        CustomJwtModule,
        CommonModule,
        PassportModule.register({
            defaultStrategy: 'user-jwt',
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AdminJwtStrategy, UserJwtStrategy, RegisterGuard],
    exports: [PassportModule, RegisterGuard]
})

export class AuthModule { }
