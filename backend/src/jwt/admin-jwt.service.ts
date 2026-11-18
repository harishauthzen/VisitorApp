import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminJwtService {

    constructor(
        private readonly jwtService: JwtService,
    ) {}

    async generateToken(admin: any) {

        const payload = {
            id: admin.id,
            email: admin.email,
            type: 'ADMIN',
            role: admin.role || 'admin',
        };

        return await this.jwtService.signAsync(
            payload,
            {
                secret: process.env.ADMIN_JWT_SECRET,
                expiresIn: '1d',
            },
        );
    }

    async verifyToken(token: string) {

        try {

            return await this.jwtService.verifyAsync(
                token,
                {
                    secret: process.env.ADMIN_JWT_SECRET,
                },
            );

        } catch {

            throw new UnauthorizedException(
                'Invalid or expired token',
            );
        }
    }
}