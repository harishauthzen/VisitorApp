import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { AuthGuard } from '@nestjs/passport';

@Controller('payment')
@UseGuards(AuthGuard(['user-jwt', 'admin-jwt']))
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Get('/:id')
    getPayment(@Param('id') id: number , @Req() req: any) {
        return this.paymentService.getPayment(id , req.user.id);
    }

    @Post()
    createPayment(@Body() dto : CreatePaymentDto , @Req() req: any) {
        return this.paymentService.createPayment(dto, req.user.id);
    }
}
