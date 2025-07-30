import { Abi, decodeEventLog, Hex, Log } from '@kaiachain/viem-ext';
import { Injectable, Logger } from '@nestjs/common';

import { AdminService } from '@/modules/admin/admin.service';
import { StudentService } from '@/modules/student/student.service';
import StudentManagerAbi from '@/shared/constants/contract/StudentManager.abi.json';

import { MileageService } from '../mileage/mileage.service';
import { MileagePointHistoryService } from '../mileage-point-history/mileage-point-history.service';
import { WalletLostService } from '../wallet-lost/wallet-lost.service';
import { Event } from './constants/event.enum';
import { EventStatus } from './constants/event-status.enum';
import { EventArgsMap, EventHandlers } from './event.types';
import { EventLogRepository } from './repository/event-log.repository';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private studentManagerAbi: Abi;
  private readonly eventHandlers: EventHandlers;

  constructor(
    private readonly eventLogRepository: EventLogRepository,
    private readonly adminService: AdminService,
    private readonly studentService: StudentService,
    private readonly mileageService: MileageService,
    private readonly mileagePointHistoryService: MileagePointHistoryService,
    private readonly walletLostService: WalletLostService,
  ) {
    this.studentManagerAbi = StudentManagerAbi as Abi;
    this.eventHandlers = this.createEventHandlers();
  }

  private createEventHandlers(): EventHandlers {
    return {
      [Event.AdminAdded]: this.AdminAdded.bind(this),
      [Event.DocSubmitted]: this.DocSubmitted.bind(this),
      [Event.DocApproved]: this.DocApproved.bind(this),
      [Event.DocRejected]: this.DocRejected.bind(this),
      [Event.StudentRegistered]: this.StudentRegistered.bind(this),
      [Event.MileageBurned]: this.MileageBurned.bind(this),
      [Event.MileageMinted]: this.MileageMinted.bind(this),
      [Event.AccountChanged]: this.AccountChanged.bind(this),
      [Event.AccountChangeConfirmed]: this.AccountChangeConfirmed.bind(this),
    };
  }

  private async callEventHandler<E extends Event>(
    eventName: E,
    args: EventArgsMap[E],
    transactionHash: Hex,
  ) {
    const handler = this.eventHandlers[eventName];

    if (handler) {
      return await handler(args, transactionHash);
    }
    this.logger.warn(`No handler found for event: ${eventName}`);
    return Promise.resolve();
  }

  async routeEventHandler(log: Log) {
    try {
      const decodedLog = decodeEventLog({
        abi: this.studentManagerAbi,
        data: log.data,
        topics: log.topics,
      });

      if (!decodedLog || !decodedLog.eventName) {
        this.logger.warn(`Could not decode event log from tx: ${log.transactionHash}`);
        return;
      }

      const { eventName, args } = decodedLog;
      const { transactionHash, logIndex, blockNumber } = log;

      const parsedEventName = eventName as Event;

      if (!transactionHash || logIndex === null || blockNumber === null) {
        this.logger.error(
          `Confirmed log is missing essential data. Tx: ${transactionHash}, LogIndex: ${logIndex}`,
        );
        return;
      }

      const isDuplicate = await this.eventLogRepository.isDuplicateInDB(transactionHash, logIndex);

      if (isDuplicate) {
        this.logger.debug(
          `[Skipped] Already confirmed event: ${eventName}, Tx: ${transactionHash}`,
        );
        return;
      }

      this.logger.log(`[Confirmed] Processing event: ${eventName}, Tx: ${transactionHash}`);

      await this.eventLogRepository.insertOrUpdateEvent({
        transaction_hash: transactionHash,
        log_index: logIndex,
        block_number: Number(blockNumber),
        event_name: eventName,
        data: this.parseLogDataToSafeValue(args),
        status: EventStatus.CONFIRMED,
      });

      await this.callEventHandler(
        parsedEventName,
        args as EventArgsMap[typeof parsedEventName],
        transactionHash,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to decode or handle event log. Tx: ${log.transactionHash}`,
          error.message,
        );
      } else {
        this.logger.error(
          `An unknown error occurred while handling event log. Tx: ${log.transactionHash}`,
        );
      }
    }
  }

  private async AdminAdded(args: EventArgsMap[Event.AdminAdded]) {
    this.logger.debug('Handling AdminAdded event...', args);
    const account = args[0];
    await this.adminService.handleAdminAddedEvent(account);
  }

  private async StudentRegistered(args: EventArgsMap[Event.StudentRegistered]) {
    this.logger.debug('Handling StudentRegistered event...', args);
    const student_hash = args[0];
    await this.studentService.handleStudentRegisteredEvent(student_hash);
  }

  private async DocSubmitted(args: EventArgsMap[Event.DocSubmitted]) {
    this.logger.debug('Handling DocSubmitted event...', args);
    const docuemnt_index = Number(args[0]);
    const doc_hash = args[2];

    await this.mileageService.handleDocSubmittedEvent(docuemnt_index, doc_hash);
  }

  private async DocApproved(args: EventArgsMap[Event.DocApproved], transaction_hash: Hex) {
    this.logger.debug('Handling DocApproved event...', args);
    const document_index = Number(args[0]);
    const student_hash = args[1];

    const student = await this.studentService.getStudentByStudentHash(student_hash);
    const { student_id } = student;

    await this.mileageService.handleDocApprovedEvent(student_id, document_index);

    await this.mileagePointHistoryService.handleDocApprovedEvent(transaction_hash);
  }

  private async DocRejected(args: EventArgsMap[Event.DocRejected], transaction_hash: Hex) {
    this.logger.debug('Handling DocRejected event...', args);
    const document_index = Number(args[0]);
    const student_hash = args[1];

    const student = await this.studentService.getStudentByStudentHash(student_hash);
    const { student_id } = student;

    await this.mileageService.handleDocRejectedEvent(student_id, document_index);

    await this.mileagePointHistoryService.handleDocRejectedEvent(transaction_hash);
  }

  private async MileageMinted(args: EventArgsMap[Event.MileageMinted], transaction_hash: Hex) {
    this.logger.debug('Handling MileageMinted event...', args);

    await this.mileagePointHistoryService.handleMileageMintedEvent(transaction_hash);
  }

  private async MileageBurned(args: EventArgsMap[Event.MileageBurned], transaction_hash: Hex) {
    this.logger.debug('Handling MileageBurned event...', args);

    await this.mileagePointHistoryService.handleMileageBurnedEvent(transaction_hash);
  }

  private async AccountChanged(args: EventArgsMap[Event.AccountChanged], transaction_hash: Hex) {
    const student_hash = args[0];
    const target_account = args[2];
    const student = await this.studentService.getStudentByStudentHash(student_hash);
    const { student_id } = student;

    await this.walletLostService.handleAccountChangedEvent(transaction_hash);
    await this.studentService.handleAccountChangedEvent(student_id, target_account);
  }

  // 학생 주관 변경
  private async AccountChangeConfirmed(args: EventArgsMap[Event.AccountChangeConfirmed]) {
    const student_hash = args[0];
    const target_account = args[2];
    const student = await this.studentService.getStudentByStudentHash(student_hash);
    const { student_id } = student;

    await this.studentService.handleAccountChangedEvent(student_id, target_account);
  }

  private parseLogDataToSafeValue(data: any): string {
    return JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    );
  }
}
