import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';

@Entity('mileage_token')
export class MileageToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  contract_address: string;

  @Column()
  symbol: string;

  @Column()
  image_url: string;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PROCESSING,
  })
  transaction_status: TRANSACTION_STATUS;

  @Column({ nullable: true })
  transaction_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
