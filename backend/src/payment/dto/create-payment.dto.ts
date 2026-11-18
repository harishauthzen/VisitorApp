import { IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
    @IsNotEmpty()
    id: number;

    @IsNotEmpty()
    userId: number;

    @IsNotEmpty()
    amount: number

    @IsNotEmpty()
    status: 'pending' | 'confirmed' | 'cancelled';
}