import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { Otp } from './otp.entity.js';
import { RegisterJwtService } from '../jwt/register-jwt.service.js';
// import { UsersService } from '../users/user.service.js';
import { VerifyOtpDto } from './dto/verifyOtp-dto.js';
import { User } from '../users/user.entity.js';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    // private readonly userService: UsersService,
    private readonly registerJwtService: RegisterJwtService,
  ) { }
  async sendOtp(email: string, phone: string) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        message: 'OTP delivery is not configured',
      };
    }

    const isuserExist = await this.userRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (isuserExist) {
      return {
        success: false,
        message: 'User already registered with this email or phone number',
      };
    }

    const otp = randomInt(100000, 1000000).toString();

    const otpExpired = new Date(
      Date.now() + 5 * 60 * 1000,
    );

    await this.otpRepository.delete({
      email,
      phone,
    });

    const otpCreated = new Otp();
    otpCreated.email = email;
    otpCreated.phone = phone;
    otpCreated.otp = otp;
    otpCreated.verified = false;
    otpCreated.purpose = 'registration';
    otpCreated.expiresAt = otpExpired;

    await this.otpRepository.save(otpCreated);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp: otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {

    try {
      const otpRecorded = await this.otpRepository.findOne({
        where: {
          email: dto.email,
          phone: dto.phone,
          purpose: 'registration',
        },
        order: { id: 'DESC' },
      });

      if (!otpRecorded) {
        return { success: false, message: "OTP not found" };
      }

      const now = new Date();
      if (now > otpRecorded.expiresAt) {
        return { success: false, message: 'OTP has expired' };
      }

      if (otpRecorded.otp !== dto.otp) {
        return { success: false, message: 'Invalid OTP' };
      }

      const existingUser = await this.userRepository.findOne({
        where: [{ email: dto.email }, { phone: dto.phone }],
      });

      if (existingUser) {
        return {
          success: false,
          message: 'User already registered with this email or phone number',
        };
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = this.userRepository.create({
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        emailVerified: false,
        phoneVerified: false,
      });
      const savedUser = await this.userRepository.save(user);

      otpRecorded.verified = true;
      await this.otpRepository.save(otpRecorded);

      const registerToken = await this.registerJwtService.generateToken({
        userId: savedUser.id,
        email: otpRecorded.email,
        phone: otpRecorded.phone,
        type: 'REGISTER',
      });

      return {
        success: true,
        message: 'OTP verified successfully',
        otpVerified: otpRecorded.verified,
        registerToken: registerToken,
      };

    } catch (error) {
      return {
        success: false,
        message: "Server error during OTP verification",
        error: error,
      };
    }
  }

  async resendOtp(email: string, phone: string) {
    try {
      return this.sendOtp(email, phone);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to resend OTP',
      };
    }
  }
}
