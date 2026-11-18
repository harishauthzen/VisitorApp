import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NoEmoji } from '../../common/emojiValidator.decorator.js';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @NoEmoji()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @NoEmoji()
  location?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
