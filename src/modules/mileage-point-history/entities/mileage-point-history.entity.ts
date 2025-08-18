import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { MILEAGE_POINT_HISTORY_TYPE } from '@/modules/mileage-point-history/constants/mileage-point-history-type.enum';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

@Entity('mileage_point_history')
export class MileagePointHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MILEAGE_POINT_HISTORY_TYPE,
  })
  type: MILEAGE_POINT_HISTORY_TYPE;

  @Column()
  mileage_token_name: string;

  @Column()
  mileage_activity_name: string;

  @Column()
  mileage_category_name: string;

  @Column()
  mileage_point: number;

  @Column()
  transaction_hash: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    nullable: true,
    default: null,
  })
  transaction_status: TRANSACTION_STATUS;

  @Column({ type: 'text', nullable: true, default: null })
  note: string;

  @ManyToOne(() => Mileage, (mileage) => mileage.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mileage_id' })
  mileage: Mileage;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
