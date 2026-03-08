import { Address, isAddressEqual } from '@kaiachain/viem-ext';

export const convertToLowercase = (address: Address): Address => address.toLowerCase() as Address;

export const isEqualAddress = (address1: Address, address2: Address): boolean =>
  isAddressEqual(address1, address2);
