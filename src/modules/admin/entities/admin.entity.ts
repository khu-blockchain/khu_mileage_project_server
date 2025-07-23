import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Address } from '@kaiachain/viem-ext';

@Entity('admin')
export class Admin {
  @PrimaryColumn()
  admin_id: string;

  @Column()
  name: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ unique: true })
  wallet_address: Address;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PROCESSING,
  })
  transaction_status: TRANSACTION_STATUS;

  @Column({ nullable: true, default: null })
  transaction_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
