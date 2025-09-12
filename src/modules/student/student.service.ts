import { Address } from '@kaiachain/viem-ext';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';

import { KaiaService } from '@/modules/kaia/kaia.service';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { convertToLowercase } from '@/shared/utils/address.utils';

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
  private readonly logger = new Logger(StudentService.name);

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
      wallet_address: convertToLowercase(walletAddress),
      department: request.department,
      bank_account_number: request.bankAccountNumber,
      bank_code: request.bankCode,
      personal_information_consent: request.personalInformationConsentStatus,
      personal_information_consent_date: new Date(),
      student_hash: request.studentHash,
    };

    // validate the raw transaction before fee payer signing
    await this.kaiaService.validateStudentManagerTransaction(
      request.rawTransaction,
      walletAddress,
      'registerStudent',
      request.studentHash,
    );

    const student = await this.studentRepository.createStudent(newStudentParams);

    // const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);
    const { txHash, feePayerSignedTx } = await this.kaiaService.calcTxHashFromRawTransaction(
      request.rawTransaction,
    );

    const updatedStudent = await this.studentRepository.updateStudent(student.student_id, {
      transaction_hash: txHash,
    });

    if (!updatedStudent) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    console.log(`txHash: ${txHash}`);

    const _hash = await this.kaiaService.sendFeepayerSignedTransaction(feePayerSignedTx);
    console.log(`_hash: ${_hash}`);

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
    if (!studentHash) {
      throw new BadRequestException('잘못된 학생 해시입니다.');
    }
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
    console.log('getStudentsParams:', getStudentsParams);
    const [students, total] = await this.studentRepository.getStudents(getStudentsParams);
    console.log('students:', students, 'total:', total);

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
    
    await this.kaiaService.validateStudentManagerFunction(request.rawTransaction, 'proposeAccountChange');
    
    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);

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

    await this.kaiaService.validateStudentManagerFunction(request.rawTransaction, 'confirmAccountChange');
    await this.kaiaService.sendTransactionWithFeePayerSign(request.rawTransaction);

    return {
      success: true,
    };
  }

  //========== Event Callback ============
  async handleStudentRegisteredEvent(student_hash: string): Promise<{ success: boolean }> {
    if (!student_hash) {
      this.logger.debug(`Failed to handle StudentRegistered event. Tx: ${student_hash}`);
      throw new BadRequestException('잘못된 학생 해시입니다.');
    }

    const student = await this.studentRepository.getStudentByStudentHash(student_hash);
    if (!student) {
      this.logger.debug(`Failed to handle StudentRegistered event. Tx: ${student_hash}`);
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }
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
    if (!student_id || !target_account) {
      this.logger.debug(`Failed to handle AccountChanged event. Tx: ${student_id}`);
      throw new BadRequestException('잘못된 학생 해시 또는 지갑 주소입니다.');
    }

    const student = await this.getStudentByStudentId(student_id);
    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    await this.studentRepository.handleAccountChangedEvent(student_id, target_account);

    return { success: true };
  }
}
