import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { RegisterJwtService } from '../../jwt/register-jwt.service.js';

@Injectable()
export class RegisterGuard
    implements CanActivate {

    constructor(
        private readonly registerJwtService: RegisterJwtService,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException(
                'Register token required',
            );
        }

        const [type, token] = authHeader.split(' ');

        if (
            type !== 'Bearer' || !token
        ) {
            throw new UnauthorizedException(
                'Invalid token format',
            );
        }

        try {
            const payload = await this.registerJwtService.verifyToken(token);
            request.registerData = payload;
            return true;
        } catch {
            throw new UnauthorizedException(
                'Register token expired or invalid',
            );
        }
    }
}