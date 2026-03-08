import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { EventStatus } from '../constants/event-status.enum';

@Entity('event_logs')
@Index(['transaction_hash', 'log_index'], { unique: true })
export class EventLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transaction_hash: string;

  @Column()
  log_index: number;

  @Column()
  block_number: number;

  @Column()
  event_name: string;

  @Column({ type: 'json' })
  data: any;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PENDING })
  status: EventStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
