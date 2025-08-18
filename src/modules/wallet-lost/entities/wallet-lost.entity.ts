import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';

import { WALLET_LOST_STATUS } from '../constants/wallet-lost-status.enum';

@Entity('wallet_lost')
export class WalletLost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  student_id: string;

  @Column()
  student_name: string;

  @Column()
  student_hash: string;

  @Column()
  previous_wallet_address: string;

  @Column()
  request_wallet_address: string;

  @Column({
    type: 'enum',
    enum: WALLET_LOST_STATUS,
    default: WALLET_LOST_STATUS.CREATED,
  })
  status: WALLET_LOST_STATUS;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    nullable: true,
    default: null,
  })
  transaction_status: TRANSACTION_STATUS;

  @Column({ nullable: true, default: null })
  transaction_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
