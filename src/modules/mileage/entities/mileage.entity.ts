import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MILEAGE_STATUS } from '@/modules/mileage/constants/mileage-status.enum';
import { MileagePointHistory } from '@/modules/mileage-point-history/entities/mileage-point-history.entity';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { Student } from '@/modules/student/entities/student.entity';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

import { MileageFile } from './mileage-file.entity';

// SW 마일리지 배점 항목 변동에 따라 기존의 비교과 활동 구분을 삭제하고
// 활동 분야, 활동만 저장하도록 변경되었습니다.
// 이 데이터는 별도의 데이터베이스로 관리하며
// 수정 빈도수가 많을 것으로 판단되어 테이블 간 참조 관계는 활동만 참조합니다.

@Entity('mileage')
export class Mileage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mileage_category_name: string;

  @Column()
  mileage_activity_name: string; // 배점 표가 변경되어도 정보를 유지하기 위해 활동 이름을 저장합니다.

  @Column({ type: 'text' })
  mileage_description: string; // 활동 내용에 대한 설명

  @Column({ nullable: true, default: null }) // 관리자 코멘트, 반려 혹은 승인 시 코멘트 저장
  admin_comment: string;

  @Column({ nullable: true, default: null })
  doc_index: number;

  @Column({ nullable: true, default: null })
  doc_hash: string;

  @Column({
    type: 'enum',
    enum: MILEAGE_STATUS,
    default: MILEAGE_STATUS.REVIEWING,
  })
  status: MILEAGE_STATUS; // 배점 표가 변경되어도 정보를 유지하기 위해 활동 이름을 저장합니다.

  @Column({
    type: 'enum',
    enum: TRANSACTION_STATUS,
    default: TRANSACTION_STATUS.PROCESSING,
  })
  transaction_status: TRANSACTION_STATUS;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: Date;

  @ManyToOne(() => Student, (student) => student.mileages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => MileageFile, (mileageFile) => mileageFile.mileage)
  mileage_files: MileageFile[];

  @ManyToOne(() => MileageActivity, (mileageActivity) => mileageActivity.mileages)
  @JoinColumn({ name: 'mileage_activity_id' })
  mileage_activity: MileageActivity;

  @OneToMany(() => MileagePointHistory, (mileagePointHistory) => mileagePointHistory.mileage)
  mileage_point_histories: MileagePointHistory[];
}
