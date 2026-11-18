import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { EventRegistration } from '../events/event-registration.entity.js';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class PaymentService {

    constructor(
        @InjectRepository(EventRegistration)
        private readonly registrationRepository: Repository<EventRegistration>,
    ) { }

    async getPayment(id: number, userId: number) {
        const getPaymentDetails = await this.registrationRepository.findOne({ where: { id , userId } });
        if (!getPaymentDetails) {
            throw new NotFoundException(`Unable to find payment details`);
        }
        return getPaymentDetails;
    }

    async createPayment(dto: CreatePaymentDto , userId: number) {

        if (dto.userId !== userId) {
            throw new UnauthorizedException(`You are not authorized to make payment for this user`);
        }

        const findPayment = await this.registrationRepository.findOne({
            where: { id: dto.id, userId }
        });
        
        if (!findPayment) {
            throw new NotFoundException(`Unable to find payment details`);
        }

        if (findPayment.status === "confirmed") {
            return { message: "Payment already done" , paymentDetails: findPayment };
        }

        if (process.env.NODE_ENV === 'production') {
            throw new ForbiddenException(
                'Demo payment confirmation is disabled in production',
            );
        }

        const updatePayment = await this.registrationRepository.update({ id: dto.id, userId }, { status: "confirmed" });

        if (updatePayment.affected === 0) {
            return { message: "Payment confirmation failed"};
        }

        return { message: "Payment confirmed successfully" , paymentDetails: { ...findPayment, status: "confirmed" } };
    }
}
