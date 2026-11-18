import { Injectable } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';

import { User } from '../users/user.entity.js';
import { OtpService } from '../otp/otp.service.js';
import { UsersService } from '../users/user.service.js';
import { CreateUserDto } from '../users/dto/createUser.dto.js';
import { LoginDto } from './dto/login-dto.js';
import { VerifyOtpDto } from '../otp/dto/verifyOtp-dto.js';
import { Otp } from '../otp/otp.entity.js';
import { AdminJwtService } from '../jwt/admin-jwt.service.js';
import { UserJwtService } from '../jwt/user-jwt.service.js';
import { OvseService } from '../common/services/ovse.services.js';
import { OvseVerification } from '../common/services/ovse.entity.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly otpService: OtpService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Otp)
        private readonly otpRepository: Repository<Otp>,
        private readonly userService: UsersService,
        private readonly adminJwtService: AdminJwtService,
        private readonly userJwtService: UserJwtService,
        // *
        private readonly ovseService: OvseService,
        @InjectRepository(OvseVerification)
        private readonly ovseRepository: Repository<OvseVerification>
    ) { }

    // async sendEmailOtp(email: string) {
    //     return this.otpService.sendOtp(email);
    // }

    // async sendPhoneOtp(phone: string) {
    //     return this.otpService.sendOtp(phone);
    // }

     // async verifyEmailOtp(email: string, otp: string) {
    //     const result = await this.otpService.verifyOtp(email, otp);

    //     if (!result.success) {
    //         return result;
    //     }

    //     await this.userRepository.update(
    //         { email },
    //         {
    //             emailVerified: true,
    //         },
    //     );

    //     return {
    //         success: true,
    //         message: 'Email verified successfully',
    //     };
    // }

    // async verifyPhoneOtp(phone: string, otp: string) {
    //     const result = await this.otpService.verifyOtp(phone, otp);

    //     if (!result.success) {
    //         return result;
    //     }

    //     await this.userRepository.update(
    //         { phone },
    //         {
    //             phoneVerified: true,
    //         },
    //     );

    //     return {
    //         success: true,
    //         message: 'Phone verified successfully',
    //     };
    // }

    async sendOtp(email: string, phone: string) {
        return this.otpService.sendOtp(email, phone);
    }

    async resendOtp(email: string, phone: string) {
        return this.otpService.resendOtp(email, phone);
    }

    async verifyOtp(dto: VerifyOtpDto) {
        const { password, confirmPassword } = dto;

        if (password !== confirmPassword) {
            return {
                success: false,
                message: 'Password and confirm password do not match',
            };
        }

        const result = await this.otpService.verifyOtp(dto);

        if (!result.success) {
            return result;
        }

        return {
            success: true,
            message: 'OTP verified successfully',
            registerToken: result.registerToken,
        };
    }

    async completeRegister(dto: CreateUserDto, req: any) {
        try {
            const userId = req?.registerData?.id;

            if (!userId) {
                return {
                    success: false,
                    message: 'Registration session is invalid.',
                };
            }

            const updateDetails = await this.userService.addDetails(userId, dto);
            
            if(!updateDetails) {
                throw new Error('Registration details failed');
            }

            return {
                success: true,
                message: 'Registration completed successfully'
            }

        } catch (error) {
            return {
                success: false,
                message: 'server error!',
                error,
            };
        }
    }

    async loginUser(dto: LoginDto) {
        try {
            let user = await this.userService.findByEmail(dto.email);

            if (!user) {
                return {
                    success: false,
                    message: 'User not found with this email',
                }
            }

            const passwordMatch = await bcrypt.compare(dto.password, user.password);

            if (!passwordMatch) {
                return {
                    success: false,
                    message: 'Invalid email or password',
                }
            }

            const normalizedRole = user.role?.toLowerCase();

            if (normalizedRole === 'admin') {
                const accessToken = await this.adminJwtService.generateToken(user);

                return {
                    success: true,
                    message: 'login user successfully',
                    token: accessToken,
                    role: 'admin',
                };
            }

            if (normalizedRole === 'user') {
                const accessToken = await this.userJwtService.generateToken(user);

                return {
                    success: true,
                    message: 'login user successfully',
                    token: accessToken,
                    role: 'user',
                };
            }

            return {
                success: false,
                message: 'Access denied. Invalid user role.',
            };

        } catch (error) {
            return {
                success: false,
                message: "server error.."
            }
        }
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({
            where: { email: ILike(email.trim()) },
        });

        if (!user) {
            return {
                success: false,
                message: 'No account found with this email address.',
            };
        }

        if (process.env.NODE_ENV === 'production') {
            return {
                success: false,
                message: 'OTP delivery is not configured',
            };
        }

        const otp = randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await this.otpRepository.delete({
            email: user.email,
            phone: user.phone,
        });

        const resetOtp = this.otpRepository.create({
            email: user.email,
            phone: user.phone,
            otp,
            verified: false,
            purpose: 'password_reset',
            expiresAt,
        });
        await this.otpRepository.save(resetOtp);

        return {
            success: true,
            message: 'If an account exists for this email, a reset code has been sent.',
            otp,
        };
    }

    async resetPassword(dto: ResetPasswordDto) {
        if (dto.password !== dto.confirmPassword) {
            return {
                success: false,
                message: 'Password and confirm password do not match',
            };
        }

        const user = await this.userRepository.findOne({
            where: { email: ILike(dto.email.trim()) },
        });
        if (!user) {
            return {
                success: false,
                message: 'Invalid or expired reset code',
            };
        }

        const resetOtp = await this.otpRepository.findOne({
            where: {
                email: user.email,
                phone: user.phone,
                otp: dto.otp,
                purpose: 'password_reset',
                verified: false,
            },
            order: { id: 'DESC' },
        });

        if (!resetOtp || resetOtp.expiresAt < new Date()) {
            return {
                success: false,
                message: 'Invalid or expired reset code',
            };
        }

        const consumedOtp = await this.otpRepository.delete({
            id: resetOtp.id,
            verified: false,
            purpose: 'password_reset',
        });
        if (!consumedOtp.affected) {
            return {
                success: false,
                message: 'Invalid or expired reset code',
            };
        }

        user.password = await bcrypt.hash(dto.password, 10);
        await this.userRepository.save(user);

        return {
            success: true,
            message: 'Password reset successfully',
        };
    }

    async verifyUser() {
        return {
            success: true,
            message: 'Please fill required details to register!',
        }
    }

    // async identityVerification(req: any) {
    //     const registerData = req.registerData;
    //     const ovseResult = await this.ovseService.createVerification({
    //         email: registerData.email,
    //         phone: registerData.phone,
    //     });

    //     console.log('ovseResult :>> ', ovseResult);

    //     if (!ovseResult?.sessionId) {
    //         return {
    //             success: false,
    //             message: 'Unable to create OVSE verification session',
    //         };
    //     }

    //     const verification = this.ovseRepository.create({
    //         userId: registerData.id,
    //         sessionId: ovseResult.sessionId,
    //         status: ovseResult.status,
    //         txnId: ovseResult.txnId
    //     });

    //     await this.ovseRepository.save(verification);

    //     return {
    //         success: true,
    //         message: 'OVSE verification session created',
    //         sessionId: ovseResult.sessionId,
    //         txnId: ovseResult.txnId,
    //         status: ovseResult.status,
    //         expiresAt: ovseResult.expiresAt,
    //     };
    // }

    // async getVerificationQr(sessionId: string, req: any) {
    //     const registerData = req.registerData;
    //     console.log('sessionId:>> ', sessionId);

    //     const verification = await this.ovseRepository.findOne({
    //         where: {
    //             sessionId,
    //             userId: registerData.id,
    //         },
    //     });

    //     if (!verification) {
    //         return {
    //             success: false,
    //             message: 'Invalid verification session',
    //         };
    //     }

    //     return this.ovseService.getVerificationQr(sessionId);
    // }

    // async getVerification(sessionId: string, req: any) {
    //     const registerData = req.registerData;

    //     const verification = await this.ovseRepository.findOne({
    //         where: {
    //             sessionId,
    //             userId: registerData.id,
    //         },
    //     });

    //     if (!verification) {
    //         return {
    //             success: false,
    //             message: 'Invalid verification session',
    //         };
    //     }

    //     const result = await this.ovseService.getVerification(
    //         sessionId,
    //     );

    //     console.log('result ********* :>> ', result);

    //     if (result.status) {
    //         verification.status = result.status;
    //     }

    //     if (result.txnId) {
    //         verification.txnId = result.txnId;
    //     }

    //     await this.ovseRepository.save(
    //         verification,
    //     );

    //     return result;
    // }

    // async cancelVerification(sessionId: string, req: any) {
    //     const registerData = req.registerData;
    //     console.log('sessionId:>> ', sessionId);

    //     const verification = await this.ovseRepository.findOne({
    //         where: {
    //             sessionId,
    //             userId: registerData.id,
    //         },
    //     });

    //     if (!verification) {
    //         return {
    //             success: false,
    //             message: 'Invalid verification session',
    //         };
    //     }

    //     return this.ovseService.cancelVerification(sessionId);
    // }

    // async listenVerificationEvents(sessionId: string, req?: any) {
    //     if (!req?.registerData?.id) {
    //         return {
    //             success: false,
    //             message: 'Unauthorized verification session access',
    //         };
    //     }

    //     return this.ovseService.listenVerificationEvents(sessionId);
    // }
}
