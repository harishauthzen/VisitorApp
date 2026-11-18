import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login-dto.js';
import { VerifyOtpDto } from '../otp/dto/verifyOtp-dto.js';
import { CreateUserDto } from '../users/dto/createUser.dto.js';
import { SendOtpDto } from './dto/send-otp-dto.js';
import { RegisterGuard } from './guards/register.guards.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) { }

    // @Post('sendEmail-otp')
    // sendEmailOtp(@Body() body: any) {
    //     return this.authService.sendEmailOtp(body.email);
    // }

    // @Post('verifyEmail-otp')
    // verifyEmailOtp(@Body() body: any) {
    //     return this.authService.verifyEmailOtp(body.email, body.otp);
    // }

    // @Post('sendPhone-otp')
    // sendPhoneOtp(@Body() body: any) {
    //     return this.authService.sendPhoneOtp(body.phone);
    // }

    // @Post('verifyPhone-otp')
    // verifyPhoneOtp(@Body() body: any) {
    //     return this.authService.verifyPhoneOtp(body.phone, body.otp);
    // }

    @Post('send-otp')
    sendOtp(@Body() dto: SendOtpDto) {
        return this.authService.sendOtp(dto.email, dto.phone);
    }

    @Post('resend-otp')
    resendOtp(@Body() dto: SendOtpDto) {
        return this.authService.resendOtp(dto.email, dto.phone);
    }

    @Post('verify-otp')
    verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    @Post('register')
    @UseGuards(RegisterGuard)
    completeRegister(@Body() dto: CreateUserDto, @Req() req: any) {
        return this.authService.completeRegister(dto, req);
    }

    @Post('login')
    loginUser(@Body() dto: LoginDto) {
        return this.authService.loginUser(dto);
    }

    @Post('forgot-password')
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto.email);
    }

    @Post('reset-password')
    resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    @Get('register')
    @UseGuards(RegisterGuard)
    verifyUser() {
        return this.authService.verifyUser();
    }

    // @Post('identity-verification')
    // @UseGuards(RegisterGuard)
    // identityVerification(@Req() req: any) {
    //     return this.authService.identityVerification(req);
    // }

    // @Get('verification/:sessionId/qr')
    // @UseGuards(RegisterGuard)
    // getVerificationQr(@Param('sessionId') sessionId: string, @Req() req : any) {
    //     return this.authService.getVerificationQr(sessionId,req);
    // }

    // @Get('verification/:sessionId')
    // @UseGuards(RegisterGuard)
    // getVerification(@Param('sessionId') sessionId: string , @Req() req : any) {
    //     return this.authService.getVerification(sessionId , req);
    // }

    // @Post('verification/:sessionId/cancel')
    // @UseGuards(RegisterGuard)
    // cancelVerification(@Param('sessionId') sessionId: string , @Req() req : any) {
    //     return this.authService.cancelVerification(sessionId , req);
    // }

    // @Get('verification/:sessionId/events')
    // @UseGuards(RegisterGuard)
    // listenVerificationEvents(@Param('sessionId') sessionId: string, @Req() req: any) {
    //     return this.authService.listenVerificationEvents(sessionId, req);
    // }
}
