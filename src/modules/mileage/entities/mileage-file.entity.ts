import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Mileage } from './mileage.entity';

@Entity('mileage_file')
export class MileageFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  original_file_name: string;

  @Column()
  stored_file_name: string; // 서버에서만 참조하는 데이터

  @Column()
  url: string;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: Date;

  @ManyToOne(() => Mileage, (mileage) => mileage.mileage_files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mileage_id' })
  mileage: Mileage;
}
