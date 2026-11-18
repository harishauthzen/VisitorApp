import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { EventEntity } from './event.entity.js';
import type { EventPass } from './event-pass.entity.js';
import type { User } from '../users/user.entity.js';

@Entity('event_registrations')
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'attendee_name' })
  attendeeName: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'date', name: 'selected_date' })
  selectedDate: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount: number;

  @Column({ default: 'pending' })
  status: 'confirmed' | 'pending' | 'cancelled';

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne('User', 'registrations', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Original event relationship.
  // Nullable because the event may be permanently deleted.
  @Column({ name: 'event_id', nullable: true })
  eventId: number | null;

  @ManyToOne('EventEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity | null;

  // Original pass relationship.
  // Nullable because the pass may be permanently deleted.
  @Column({ name: 'pass_id', nullable: true })
  passId: number | null;

  @ManyToOne('EventPass', 'registrations', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'pass_id' })
  pass: EventPass | null;

  // Historical snapshots
  @Column({ type: 'varchar', nullable: true })
  eventNameSnapshot: string | null;

  @Column({ type: 'varchar', nullable: true })
  passNameSnapshot: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  passPriceSnapshot: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  qrToken: string | null;

  @Column({ default: false })
  isCheckedIn: boolean;

  @Column({ type: 'int', default: 0 })
  scanCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}