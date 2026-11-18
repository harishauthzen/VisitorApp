import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { NoEmoji } from '../../common/emojiValidator.decorator.js';

export class CreateEventPassDto {
  @IsNotEmpty()
  @IsString()
  @NoEmoji()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalSlots: number;
}
