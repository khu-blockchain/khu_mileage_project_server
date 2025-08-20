import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { POINT_TYPE } from '@/modules/mileage-rubric/constants/point-type.enum';
import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';

@Entity('mileage_activity')
export class MileageActivity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: POINT_TYPE,
    default: POINT_TYPE.OPTIONAL,
  })
  point_type: POINT_TYPE;

  @Column({ type: 'text', nullable: true, default: null })
  point_description: string; // 배점과 관련한 설명입니다.

  @Column({ type: 'integer', nullable: true, default: null })
  fixed_point: number | null; // 기본 배점, 선택 배점일 경우 null입니다.

  @OneToMany(() => Mileage, (mileage) => mileage.mileage_activity)
  mileages: Mileage[];

  @ManyToOne(() => MileageCategory, (mileageCategory) => mileageCategory.mileage_activities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'mileage_category_id' })
  mileage_category: MileageCategory;
}
