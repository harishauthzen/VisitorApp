import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  IsPhoneNumber
} from 'class-validator';

export class SendOtpDto {
  @IsEmail({}, {
    message: 'Please provide a valid email',
  })
  @IsNotEmpty({
    message: 'Email is required',
  })
  email: string;

  @IsString()
  @IsNotEmpty({
    message: 'Phone number is required',
  })
  @IsPhoneNumber('IN')
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Enter a valid 10-digit mobile number',
  })
  phone: string;
}
