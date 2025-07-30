import { Abi } from '@kaiachain/viem-ext';

import studentManagerAbiJson from './StudentManager.abi.json';
import swMileageTokenAbiJson from './SwMileageToken.abi.json';
import swMileageTokenFactoryAbiJson from './SwMileageTokenFactory.abi.json';

export const studentManagerAbi = studentManagerAbiJson as Abi;
export const swMileageTokenAbi = swMileageTokenAbiJson as Abi;
export const swMileageTokenFactoryAbi = swMileageTokenFactoryAbiJson as Abi;
