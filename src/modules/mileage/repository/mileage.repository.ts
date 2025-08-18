import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MILEAGE_STATUS } from '@/modules/mileage/constants/mileage-status.enum';
import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { CreateMileageInitParams, GetMileagesParams } from '@/modules/mileage/mileage.types';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

@Injectable()
export class MileageRepository extends Repository<Mileage> {
  constructor(private readonly dataSource: DataSource) {
    super(Mileage, dataSource.createEntityManager());
  }

  async createMileageInit(data: CreateMileageInitParams): Promise<Mileage> {
    const newMileage = this.create({
      ...data,
    });
    return this.save(newMileage);
  }

  async updatePendingMileage(id: number, transaction_hash: string): Promise<Mileage | null> {
    const mileage = await this.findMileageById(id);
    if (!mileage) {
      return null;
    }
    return this.save({ ...mileage, transaction_hash });
  }

  async getMyMileages(studentId: string): Promise<Mileage[]> {
    return this.find({
      where: {
        student: { student_id: studentId },
        transaction_status: TRANSACTION_STATUS.CONFIRMED,
      },
      order: {
        created_at: 'DESC',
      },
      relations: ['student', 'mileage_activity'],
    });
  }

  async getMileages(params: GetMileagesParams): Promise<[Mileage[], number]> {
    const { take, skip, student_id, status, all } = params;

    const [mileages, total] = await this.findAndCount({
      where: {
        transaction_status: TRANSACTION_STATUS.CONFIRMED,
        ...(student_id && { student: { student_id } }),
        ...(status && { status }),
      },
      ...(!all && { take, skip }),
      order: {
        created_at: 'DESC',
      },
      relations: ['student', 'mileage_activity'],
    });

    return [mileages, total];
  }

  async findMileageWithPointHistories(id: number): Promise<Mileage | null> {
    const mileage = await this.findOne({
      where: { id },
      relations: ['student', 'mileage_files', 'mileage_activity','mileage_point_histories'],
    });
    return mileage;
  }

  async findMileageById(id: number): Promise<Mileage | null> {
    const mileage = await this.findOne({
      where: { id },
      relations: ['student', 'mileage_files', 'mileage_activity'],
    });
    return mileage;
  }

  async findMileageByDocHash(doc_hash: string): Promise<Mileage | null> {
    const mileage = await this.findOneBy({ doc_hash });
    if (!mileage) {
      return null;
    }
    return mileage;
  }

  async updateMileageStatus(
    id: number,
    status: MILEAGE_STATUS,
    transaction_status: TRANSACTION_STATUS,
    admin_comment?: string,
  ): Promise<Mileage | null> {
    const mileage = await this.findMileageById(id);
    if (!mileage) {
      return null;
    }
    const updatedMileage = {
      ...mileage,
      status,
      transaction_status,
      ...(admin_comment && { admin_comment }),
    };
    return this.save(updatedMileage);
  }

  //==============Event callback===================

  async handleDocSubmittedEvent(
    id: number,
    transaction_status: TRANSACTION_STATUS,
    doc_index: number,
  ): Promise<Mileage | null> {
    const mileage = await this.findMileageById(id);
    if (!mileage) {
      return null;
    }
    return this.save({ ...mileage, transaction_status, doc_index });
  }

  async handleDocApprovedEvent(
    student_id: string,
    document_index: number,
  ): Promise<Mileage | null> {
    const mileage = await this.findOneBy({
      student: { student_id },
      doc_index: document_index,
    });
    if (!mileage) {
      return null;
    }
    return this.save({
      ...mileage,
      transaction_status: TRANSACTION_STATUS.CONFIRMED,
    });
  }

  // handleDocApprovedEvent와 handleDocRejectedEvent는 동일한 로직이지만,
  // 독립적으로 관리하는 것이 좋다고 판단되어 함수를 분리하였습니다.
  async handleDocRejectedEvent(
    student_id: string,
    document_index: number,
  ): Promise<Mileage | null> {
    console.log('student_id22222', student_id);
    const mileage = await this.findOneBy({
      student: { student_id },
      doc_index: document_index,
    });
    if (!mileage) {
      return null;
    }
    return this.save({
      ...mileage,
      transaction_status: TRANSACTION_STATUS.CONFIRMED,
    });
  }
}
