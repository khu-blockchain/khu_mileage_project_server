import { Address, Hex } from '@kaiachain/viem-ext';

import { Event } from './constants/event.enum';

type account = Address;
type tokenAddress = Address;
type targetAccount = Address;
type studentId = string;
type documentIndex = number;
type docHash = string;
type amount = number;
type reasonHash = string;
type admin = Address;
type tokenAddress = Address;

export type EventArgsMap = {
  [Event.AdminAdded]: { account: account };
  [Event.StudentRegistered]: { studentId: studentId; account: account };
  [Event.DocSubmitted]: { documentIndex: documentIndex; studentId: studentId; docHash: docHash };
  [Event.DocApproved]: { documentIndex: documentIndex; studentId: studentId; amount: amount };
  [Event.DocRejected]: {
    documentIndex: documentIndex;
    studentId: studentId;
    reasonHash: reasonHash;
  };
  [Event.MileageBurned]: { studentId: studentId; account: account; admin: admin; amount: amount };
  [Event.MileageMinted]: { studentId: studentId; account: account; admin: admin; amount: amount };
  [Event.AccountChanged]: { studentId: studentId; account: account; targetAccount: targetAccount };
  [Event.AccountChangeConfirmed]: {
    studentId: studentId;
    account: account;
    targetAccount: targetAccount;
  };
  [Event.MileageTokenCreated]: { tokenAddress: tokenAddress };
};

export type EventHandler<E extends Event> = (
  args: EventArgsMap[E],
  transaction_hash: Hex,
) => Promise<void>;

export type EventHandlers = {
  [E in Event]: EventHandler<E>;
};
