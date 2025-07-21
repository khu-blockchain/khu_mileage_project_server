import { DataSource, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Mileage } from '../entities/mileage.entity';
import { CreateMileageInitParams, GetMileagesParams } from '../mileage.types';
import { MILEAGE_STATUS } from '../constants/mileage-status.enum';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

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
      where: { student: { student_id: studentId } },
      relations: ['student'],
    });
  }

  async getMileages(params: GetMileagesParams): Promise<[Mileage[], number]> {
    const { take, skip, student_id, status } = params;

    const [mileages, total] = await this.findAndCount({
      where: {
        ...(student_id && { student_id }),
        ...(status && { status }),
      },
      take,
      skip,
      order: {
        created_at: 'DESC',
      },
    });

    return [mileages, total];
  }

  async findMileageById(id: number): Promise<Mileage | null> {
    const mileage = await this.findOne({
      where: { id },
      relations: ['student', 'mileage_files'],
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
