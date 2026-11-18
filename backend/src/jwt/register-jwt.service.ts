import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RegisterJwtService {

    constructor(
        private readonly jwtService: JwtService,
    ) {}

    async generateToken(payloadData : {
        userId : number,
        email: string,
        phone: string,
        type:string
    }) {

        const payload = {
            id: payloadData.userId,
            email: payloadData.email,
            phone: payloadData.phone,
            type: payloadData.type,
        };

        return await this.jwtService.signAsync(
            payload,
            {
                secret: process.env.REGISTER_JWT_SECRET,
                expiresIn: '5m',
            },
        );
    }

    async verifyToken(token: string) {

        try {

            const payload =
                await this.jwtService.verifyAsync(
                    token,
                    {
                        secret:
                            process.env.REGISTER_JWT_SECRET,
                    },
                );

            if (payload.type !== 'REGISTER') {

                throw new UnauthorizedException(
                    'Invalid register token',
                );
            }

            return payload;

        } catch {

            throw new UnauthorizedException(
                'Invalid or expired register token',
            );
        }
    }
}