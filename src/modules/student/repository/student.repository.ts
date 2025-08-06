import { Address } from '@kaiachain/viem-ext';
import { Injectable } from '@nestjs/common';
import { DataSource, Like, Repository } from 'typeorm';

import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

import { Student } from '../entities/student.entity';
import { CreateStudentParams, GetStudentsParams } from '../student.types';

@Injectable()
export class StudentRepository extends Repository<Student> {
  constructor(private dataSource: DataSource) {
    super(Student, dataSource.createEntityManager());
  }

  async createStudent(data: CreateStudentParams): Promise<Student> {
    const newStudent = this.create({
      ...data,
      transaction_status: TRANSACTION_STATUS.PROCESSING,
    });
    return this.save(newStudent);
  }

  async updateStudent(student_id: string, data: Partial<Student>): Promise<Student | null> {
    const student = await this.getStudentByStudentId(student_id);
    if (!student) {
      return null;
    }
    return this.save({ ...student, ...data });
  }

  async getStudents(params: GetStudentsParams): Promise<[Student[], number]> {
    const { take, skip, student_id, name } = params;

    const [students, total] = await this.findAndCount({
      where: {
        transaction_status: TRANSACTION_STATUS.CONFIRMED,
        ...(student_id && { student_id }),
        ...(name && { name: Like(`%${name}%`) }),
      },
      take,
      skip,
      order: {
        created_at: 'DESC',
      },
    });

    return [students, total];
  }

  async getStudentByStudentHash(student_hash: string): Promise<Student | null> {
    return await this.findOne({ where: { student_hash } });
  }

  async getStudentByStudentId(student_id: string): Promise<Student | null> {
    return await this.findOneBy({ student_id });
  }

  async getStudentByWalletAddress(wallet_address: string): Promise<Student | null> {
    return await this.findOneBy({ wallet_address });
  }

  //========== Event Callback ============

  async handleStudentRegisteredEvent(
    student_id: string,
    status: TRANSACTION_STATUS,
  ): Promise<Student | null> {
    return await this.updateStudent(student_id, { transaction_status: status });
  }

  async handleAccountChangedEvent(
    student_id: string,
    wallet_address: Address,
  ): Promise<Student | null> {
    return await this.updateStudent(student_id, {
      wallet_address,
    });
  }
}
