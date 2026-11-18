import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { EventEntity } from './event.entity.js';
import type { EventRegistration } from './event-registration.entity.js';

import { NoEmoji } from '../common/emojiValidator.decorator.js';

@Entity('event_passes')
export class EventPass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @NoEmoji()
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ default: 0 })
  totalSlots: number;

  @Column({ default: 0 })
  soldSlots: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'event_id' })
  eventId: number;

  @ManyToOne('EventEntity', 'passes', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @OneToMany('EventRegistration', 'pass')
  registrations: EventRegistration[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_with_event', default: false })
  deletedWithEvent: boolean;

  get availableSlots(): number {
    return this.totalSlots - this.soldSlots;
  }
}