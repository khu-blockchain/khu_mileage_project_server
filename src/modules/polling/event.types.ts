import { Address, Hex } from '@kaiachain/viem-ext';

import { Event } from './constants/event.enum';

type account = Address;
type targetAccount = Address;
type studentHash = string;
type documentIndex = number;
type docHash = string;
type amount = number;
type reasonHash = string;
type admin = Address;

export type EventArgsMap = {
  [Event.AdminAdded]: [account];
  [Event.StudentRegistered]: [studentHash, account];
  [Event.DocSubmitted]: [documentIndex, studentHash, docHash];
  [Event.DocApproved]: [documentIndex, studentHash, amount];
  [Event.DocRejected]: [documentIndex, studentHash, reasonHash];
  [Event.MileageBurned]: [studentHash, account, admin, amount];
  [Event.MileageMinted]: [studentHash, account, admin, amount];
  [Event.AccountChanged]: [studentHash, account, targetAccount];
  [Event.AccountChangeConfirmed]: [studentHash, account, targetAccount];
};

export type EventHandler<E extends Event> = (
  args: EventArgsMap[E],
  transaction_hash: Hex,
) => Promise<void>;

export type EventHandlers = {
  [E in Event]: EventHandler<E>;
};
