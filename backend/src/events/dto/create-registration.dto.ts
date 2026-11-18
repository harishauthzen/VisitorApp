import { IsDateString, IsEmail, IsNotEmpty, IsNumber, Matches, IsString, Min } from 'class-validator';
import { NoEmoji } from '../../common/emojiValidator.decorator.js';

export class CreateRegistrationDto {
  @IsNotEmpty()
  @IsString()
  @NoEmoji()
  attendeeName: string;

  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must contain exactly 10 digits',
  })
  phone: string;

  @IsNotEmpty()
  @IsDateString()
  selectedDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  passId: number;
}
