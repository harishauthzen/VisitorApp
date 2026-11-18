import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserJwtService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      type: 'USER',
      role: user.role || 'user',
    };

    const secret = process.env.USER_JWT_SECRET;

    if (!secret) {
      throw new Error('USER_JWT_SECRET is not defined');
    }

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '1d',
    });
  }

  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.USER_JWT_SECRET,
      });

      if (payload.type !== 'USER') {
        throw new UnauthorizedException('Invalid user token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
