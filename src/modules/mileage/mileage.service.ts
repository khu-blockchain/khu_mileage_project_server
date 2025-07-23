import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Hex } from '@kaiachain/viem-ext';
import { Transactional, runOnTransactionRollback } from 'typeorm-transactional';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { cleanupUploadedFiles } from '@/shared/utils/file.utils';

import { AuthUserContext } from '@/modules/auth/auth.types';
import { Role } from '@/modules/auth/constants/role.constants';
import { KaiaService } from '@/modules/kaia/kaia.service';
import { MileageRubricService } from '@/modules/mileage-rubric/mileage-rubric.service';
import { StudentService } from '@/modules/student/student.service';
import { MileagePointHistoryService } from '@/modules/mileage-point-history/mileage-point-history.service';
import { MILEAGE_POINT_HISTORY_TYPE } from '@/modules/mileage-point-history/constants/mileage-point-history-type.enum';
import { MileageTokenService } from '@/modules/mileage-token/mileage-token.service';

import { MILEAGE_STATUS } from './constants/mileage-status.enum';
import { Mileage } from './entities/mileage.entity';
import {
  CreateMileageRequest,
  CreateMileageResponse,
  ApproveMileageResponse,
  ApproveMileageRequest,
  GetMileagesRequest,
  MintMileageResponse,
  MintMileageRequest,
  RejectMileageRequest,
  RejectMileageResponse,
  BurnMileageResponse,
  BurnMileageRequest,
} from './dto';
import {
  CreateMileageFileParams,
  CreateMileageInitParams,
  GetMileagesParams,
} from './mileage.types';
import { MileageRepository } from './repository/mileage.repository';
import { MileageFileRepository } from './repository/mileage-file.repository';

@Injectable()
export class MileageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mileageRubricService: MileageRubricService,
    private readonly studentService: StudentService,
    private readonly kaiaService: KaiaService,
    private readonly mileageRepository: MileageRepository,
    private readonly mileageFileRepository: MileageFileRepository,
    private readonly mileagePointHistoryService: MileagePointHistoryService,
    private readonly mileageTokenService: MileageTokenService,
  ) {}

  @Transactional()
  async create(
    input: CreateMileageRequest,
    mileageFiles: Express.Multer.File[],
  ): Promise<CreateMileageResponse> {
    runOnTransactionRollback(async () => {
      await cleanupUploadedFiles(mileageFiles);
    });
    const { mileageActivityId, studentId, rawTransaction } = input;

    const mileageActivity = await this.mileageRubricService.findActivityById(+mileageActivityId);

    if (!mileageActivity) {
      throw new NotFoundException('Mileage activity not found');
    }

    const student = await this.studentService.getStudentByStudentId(studentId);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const mileageInitParams: CreateMileageInitParams = {
      mileage_category_name: input.mileageCategoryName,
      mileage_activity_name: mileageActivity.name,
      mileage_description: input.mileageDescription,
      doc_hash: input.docHash,
      status: MILEAGE_STATUS.REVIEWING,
      transaction_status: TRANSACTION_STATUS.PROCESSING,
      student,
      mileage_activity: mileageActivity,
    };

    const newMileage = await this.mileageRepository.createMileageInit(mileageInitParams);

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction as Hex);

    const uploadedFiles: CreateMileageFileParams[] = mileageFiles.map((file) => {
      const serverUrl = this.configService.get('app.publicFileUrl');
      return {
        stored_file_name: file.filename,
        url: `${serverUrl}${file.filename}`,
        original_file_name: file.originalname,
        mileage: newMileage,
      };
    });

    await this.mileageFileRepository.createMileageFiles(uploadedFiles);

    await this.mileageRepository.updatePendingMileage(newMileage.id, txHash);

    return {
      success: true,
    };
  }

  async getMyMileages(studentId: string): Promise<Mileage[]> {
    return this.mileageRepository.getMyMileages(studentId);
  }

  async getMileages(query: GetMileagesRequest): Promise<{ mileages: Mileage[]; total: number }> {
    const { limit, page, studentId, status } = query;
    const take = limit;
    const skip = (page - 1) * limit;

    const getMileagesParams: GetMileagesParams = {
      take,
      skip,
      student_id: studentId,
      status,
    };
    const [mileages, total] = await this.mileageRepository.getMileages(getMileagesParams);

    return { mileages, total };
  }

  async getMileageByAuth(id: number, user: AuthUserContext): Promise<Mileage> {
    const mileage = await this.getMileageById(id);

    if (user.role === Role.STUDENT && mileage.student.student_id !== user.student_id) {
      throw new ForbiddenException('You are not allowed to access this mileage');
    }

    return mileage;
  }

  async getMileageById(id: number): Promise<Mileage> {
    const mileage = await this.mileageRepository.findMileageById(id);
    if (!mileage) {
      throw new NotFoundException('Mileage not found');
    }
    return mileage;
  }

  @Transactional()
  async approveMileage(id: number, body: ApproveMileageRequest): Promise<ApproveMileageResponse> {
    const { mileagePoint, rawTransaction } = body;
    const mileage = await this.getMileageById(id);

    this.checkMileageStatus(mileage, MILEAGE_STATUS.REVIEWING);

    const currentTokenAddress = await this.kaiaService.getActiveMileageTokenAddress();

    const currentToken =
      await this.mileageTokenService.getMileageTokenByContractAddress(currentTokenAddress);

    // DocIndex로 추적 가능
    // Doc Status: Approved, TxStatus: Processing으로 처리 후
    // Event로 TxStatus만 변경 (docHash 사용)
    // Client에서는 Doc Status, TxStatus를 모두 확인하여 Doc 상태 결정 가능
    await this.mileageRepository.updateMileageStatus(
      id,
      MILEAGE_STATUS.APPROVED,
      TRANSACTION_STATUS.PROCESSING,
    );

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

    await this.mileagePointHistoryService.createMileagePointHistoryInit({
      type: MILEAGE_POINT_HISTORY_TYPE.MILEAGE_APPROVED,
      mileageTokenName  : currentToken.name,
      mileageActivityName: mileage.mileage_activity_name,
      mileageCategoryName: mileage.mileage_category_name,
      mileagePoint: mileagePoint,
      transactionStatus: TRANSACTION_STATUS.PROCESSING,
      transactionHash: txHash,
      mileage,
    });

    return {
      success: true,
    };
  }

  @Transactional()
  async rejectMileage(id: number, body: RejectMileageRequest): Promise<RejectMileageResponse> {
    const { adminComment, rawTransaction } = body;
    const mileage = await this.getMileageById(id);

    this.checkMileageStatus(mileage, MILEAGE_STATUS.REVIEWING);

    await this.mileageRepository.updateMileageStatus(
      id,
      MILEAGE_STATUS.REJECTED,
      TRANSACTION_STATUS.PROCESSING,
      adminComment,
    );

    await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

    // DocIndex로 추적 가능
    // Doc Status: Rejected, TxStatus: Processing으로 처리 후
    // Event로 TxStatus만 변경
    // Client에서는 Doc Status, TxStatus를 모두 확인하여 Doc 상태 결정 가능

    return {
      success: true,
    };
  }

  @Transactional()
  async mintMileage(id: number, body: MintMileageRequest): Promise<MintMileageResponse> {
    const { mileagePoint, note, rawTransaction } = body;
    const mileage = await this.getMileageById(id);

    this.checkMileageStatus(mileage, MILEAGE_STATUS.APPROVED);

    const currentTokenAddress = await this.kaiaService.getActiveMileageTokenAddress();

    const currentToken =
      await this.mileageTokenService.getMileageTokenByContractAddress(currentTokenAddress);

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

    await this.mileagePointHistoryService.createMileagePointHistoryInit({
      type: MILEAGE_POINT_HISTORY_TYPE.MILEAGE_MINTED,
      mileageTokenName: currentToken.name,
      mileageActivityName: mileage.mileage_activity_name,
      mileageCategoryName: mileage.mileage_category_name,
      mileagePoint: mileagePoint,
      transactionStatus: TRANSACTION_STATUS.PROCESSING,
      transactionHash: txHash,
      note,
      mileage,
    });

    return {
      success: true,
    };
  }

  @Transactional()
  async burnMileage(id: number, body: BurnMileageRequest): Promise<BurnMileageResponse> {
    const { mileagePoint, note, rawTransaction } = body;
    const mileage = await this.getMileageById(id);

    this.checkMileageStatus(mileage, MILEAGE_STATUS.APPROVED);

    const currentTokenAddress = await this.kaiaService.getActiveMileageTokenAddress();

    const currentToken =
      await this.mileageTokenService.getMileageTokenByContractAddress(currentTokenAddress);

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

    await this.mileagePointHistoryService.createMileagePointHistoryInit({
      type: MILEAGE_POINT_HISTORY_TYPE.MILEAGE_BURNED,
      mileageTokenName: currentToken.name,
      mileageActivityName: mileage.mileage_activity_name,
      mileageCategoryName: mileage.mileage_category_name,
      mileagePoint: mileagePoint,
      transactionStatus: TRANSACTION_STATUS.PROCESSING,
      transactionHash: txHash,
      note,
      mileage,
    });

    return {
      success: true,
    };
  }

  checkMileageStatus(mileage: Mileage, status: MILEAGE_STATUS) {
    if (mileage.status !== status) {
      throw new BadRequestException('마일리지 상태가 올바르지 않습니다.');
    }
  }

  //============Event Callback================

  async handleDocSubmittedEvent(
    doc_index: number,
    doc_hash: string,
  ): Promise<{ success: boolean }> {
    const mileage = await this.mileageRepository.findMileageByDocHash(doc_hash);
    if (!mileage) {
      throw new NotFoundException('Mileage not found');
    }

    await this.mileageRepository.handleDocSubmittedEvent(
      mileage.id,
      TRANSACTION_STATUS.CONFIRMED,
      doc_index,
    );

    return { success: true };
  }

  async handleDocApprovedEvent(student_id: string, document_index: number): Promise<Mileage> {
    const mileage = await this.mileageRepository.handleDocApprovedEvent(student_id, document_index);
    if (!mileage) {
      throw new NotFoundException('Mileage not found');
    }
    this.checkMileageStatus(mileage, MILEAGE_STATUS.APPROVED);
    await this.mileageRepository.handleDocApprovedEvent(
      mileage.student.student_id,
      mileage.doc_index,
    );
    return mileage;
  }

  async handleDocRejectedEvent(student_id: string, document_index: number): Promise<Mileage> {
    const mileage = await this.mileageRepository.handleDocRejectedEvent(student_id, document_index);
    if (!mileage) {
      throw new NotFoundException('Mileage not found');
    }
    this.checkMileageStatus(mileage, MILEAGE_STATUS.REJECTED);
    await this.mileageRepository.handleDocRejectedEvent(
      mileage.student.student_id,
      mileage.doc_index,
    );
    return mileage;
  }
}
