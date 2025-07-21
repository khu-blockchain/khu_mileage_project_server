import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { Exclude } from 'class-transformer';

@Entity('student')
export class Student {
  @PrimaryColumn({ length: 10 })
  student_id: string;

  @Column({ length: 10 })
  name: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  department: string;

  @Column()
  wallet_address: string;

  @Column()
  bank_account_number: string;

  @Column()
  bank_code: string;

  @Column()
  personal_information_consent: boolean;

  @Column()
  personal_information_consent_date: Date;

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PROCESSING,
  })
  transaction_status: TRANSACTION_STATUS;

  @Column({ nullable: true })
  student_hash: string;

  @Column({ nullable: true })
  transaction_hash: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Mileage, (mileage) => mileage.student)
  mileages: Mileage[];
}
