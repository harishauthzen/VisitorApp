import { Injectable } from '@nestjs/common';

import { PassportStrategy }
    from '@nestjs/passport';

import {
    ExtractJwt,
    Strategy,
} from 'passport-jwt';

@Injectable()
export class AdminJwtStrategy
    extends PassportStrategy(
        Strategy,
        'admin-jwt',
    ) {

    constructor() {

        const secret =
            process.env.ADMIN_JWT_SECRET;

        if (!secret) {

            throw new Error(
                'ADMIN_JWT_SECRET is not defined',
            );
        }

        super({

            jwtFromRequest:
                ExtractJwt
                    .fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey: secret,
        });
    }

    async validate(payload: any) {

        if (payload.type !== 'ADMIN' || payload.role !== 'admin') {
            return null;
        }

        return {
            id: payload.id,
            email: payload.email,
            type: payload.type,
            role: payload.role,
        };
    }
}

@Injectable()
export class UserJwtStrategy
    extends PassportStrategy(
        Strategy,
        'user-jwt',
    ) {

    constructor() {

        const secret =
            process.env.USER_JWT_SECRET;

        if (!secret) {

            throw new Error(
                'USER_JWT_SECRET is not defined',
            );
        }

        super({

            jwtFromRequest:
                ExtractJwt
                    .fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey: secret,
        });
    }

    async validate(payload: any) {

        if (payload.type !== 'USER' || payload.role !== 'user') {
            return null;
        }

        return {
            id: payload.id,
            email: payload.email,
            phone: payload.phone,
            type: payload.type,
            role: payload.role,
        };
    }
}