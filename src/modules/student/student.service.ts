import { Address } from '@kaiachain/viem-ext';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { KaiaService } from '@/modules/kaia/kaia.service';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

import { hashPassword } from '../auth/utils/hash.utils';
import {
  ConfirmWalletChangeRequest,
  CreateStudentRequest,
  CreateWalletChangeRequest,
  GetStudentsRequest,
} from './dto';
import { Student } from './entities/student.entity';
import { StudentRepository } from './repository/student.repository';
import { CreateStudentParams, GetStudentsParams } from './student.types';

@Injectable()
export class StudentService {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly kaiaService: KaiaService,
  ) {}

  @Transactional()
  async createStudent(request: CreateStudentRequest): Promise<Student> {
    const { studentId, walletAddress } = request;

    if (await this.studentRepository.getStudentByStudentId(studentId)) {
      throw new ConflictException('이미 사용중인 학번입니다.');
    }

    if (await this.studentRepository.getStudentByWalletAddress(walletAddress)) {
      throw new ConflictException('이미 사용중인 지갑 주소입니다.');
    }

    const hashedPassword = await hashPassword(request.password);

    const newStudentParams: CreateStudentParams = {
      student_id: studentId,
      name: request.name,
      password: hashedPassword,
      email: request.email,
      wallet_address: walletAddress,
      department: request.department,
      bank_account_number: request.bankAccountNumber,
      bank_code: request.bankCode,
      personal_information_consent: request.personalInformationConsentStatus,
      student_hash: request.studentHash,
    };

    const student = await this.studentRepository.createStudent(newStudentParams);

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);

    const updatedStudent = await this.studentRepository.updateStudent(student.student_id, {
      transaction_hash: txHash,
    });

    if (!updatedStudent) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    return updatedStudent;
  }

  async getStudentByStudentId(studentId: string): Promise<Student> {
    const student = await this.studentRepository.getStudentByStudentId(studentId);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }
    return student;
  }

  async getStudentByStudentHash(studentHash: string): Promise<Student> {
    const student = await this.studentRepository.getStudentByStudentHash(studentHash);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }
    return student;
  }

  async getStudents(query: GetStudentsRequest): Promise<{ students: Student[]; total: number }> {
    const { page, limit, studentId, name } = query;
    const take = limit;
    const skip = (page - 1) * limit;

    const getStudentsParams: GetStudentsParams = {
      take,
      skip,
      student_id: studentId,
      name,
    };
    const [students, total] = await this.studentRepository.getStudents(getStudentsParams);

    return { students, total };
  }

  async createWalletChange(
    studentId: string,
    request: CreateWalletChangeRequest,
  ): Promise<{ success: boolean }> {
    const student = await this.getStudentByStudentId(studentId);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);

    return {
      success: true,
    };
  }

  async confirmWalletChange(
    studentId: string,
    request: ConfirmWalletChangeRequest,
  ): Promise<{ success: boolean }> {
    const student = await this.getStudentByStudentId(studentId);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);

    return {
      success: true,
    };
  }

  //========== Event Callback ============
  async handleStudentRegisteredEvent(student_hash: string): Promise<{ success: boolean }> {
    const student = await this.getStudentByStudentHash(student_hash);
    await this.studentRepository.handleStudentRegisteredEvent(
      student.student_id,
      TRANSACTION_STATUS.CONFIRMED,
    );

    return { success: true };
  }

  async handleAccountChangedEvent(
    student_id: string,
    target_account: Address,
  ): Promise<{ success: boolean }> {
    const student = await this.getStudentByStudentId(student_id);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    await this.studentRepository.handleAccountChangedEvent(student_id, target_account);

    return { success: true };
  }
}
