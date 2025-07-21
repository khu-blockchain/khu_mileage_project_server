import { EventStatus } from './constants/event-status.enum';

export type EventLogsParams = {
  transaction_hash: string;
  log_index: number;
  event_name: string;
  block_number: number;
  data: any;
  status: EventStatus;
};
