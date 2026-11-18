import {
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

import { NoEmoji } from '../../common/emojiValidator.decorator.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @NoEmoji()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @NoEmoji()
  @Length(2, 50)
  lastName: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  @NoEmoji()
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  company: string;
}
