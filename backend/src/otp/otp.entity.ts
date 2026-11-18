import { IsEmail, IsPhoneNumber } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('otp')
@Index(['email', 'phone'], { unique: true })
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @IsPhoneNumber()
  phone: string;

  @Column()
  otp: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: 'registration' })
  purpose: string;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
