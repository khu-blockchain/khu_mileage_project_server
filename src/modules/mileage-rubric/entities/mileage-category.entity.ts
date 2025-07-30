import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MileageActivity } from './mileage-activity.entity';

// 마일리지 분야에 대한 데이터입니다.
// 대분류로 생각하시면 됩니다.

@Entity('mileage_category')
export class MileageCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: Date;

  @OneToMany(() => MileageActivity, (mileageActivity) => mileageActivity.mileage_category)
  mileage_activities: MileageActivity[];
}
