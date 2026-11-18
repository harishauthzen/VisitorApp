import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminJwtService } from './admin-jwt.service.js';
import { RegisterJwtService } from './register-jwt.service.js';
import { UserJwtService } from './user-jwt.service.js';

@Module({
    imports: [
        JwtModule.register({}),
    ],

    providers: [
        AdminJwtService,
        RegisterJwtService,
        UserJwtService,
    ],

    exports: [
        AdminJwtService,
        RegisterJwtService,
        UserJwtService,
    ],
})
export class CustomJwtModule {}