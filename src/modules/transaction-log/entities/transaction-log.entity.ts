import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TxLogDomain } from '../constants/tx-log-domain.enum';
import { TxLogStage } from '../constants/tx-log-stage.enum';

@Entity('transaction_log')
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TxLogDomain })
  domain: TxLogDomain;

  @Column()
  domain_id: string;

  @Column({ type: 'enum', enum: TxLogStage })
  stage: TxLogStage;

  @Column({ type: 'text', nullable: true })
  raw_transaction: string | null;

  @Column({ type: 'varchar', nullable: true })
  tx_hash: string | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'json', nullable: true })
  metadata: object | null;

  @CreateDateColumn()
  created_at: Date;
}
