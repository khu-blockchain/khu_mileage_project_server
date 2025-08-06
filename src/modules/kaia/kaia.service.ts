import { createWalletClient, Hex, http, kairos, privateKeyToAccount } from '@kaiachain/viem-ext';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Address, createPublicClient } from 'viem';

import StudentManagerABI from '@/shared/constants/contract/StudentManager.abi.json';

@Injectable()
export class KaiaService {
  private publicClient;
  private feePayerClient;
  private studentManagerContractAddress: Hex;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('kairos.rpcUrl');
    const privateKey = this.configService.get<string>('feePayer.privateKey');

    if (!rpcUrl || !privateKey) {
      throw new InternalServerErrorException(
        'RPC_URL or ADMIN_PRIVATE_KEY is not configured in .env',
      );
    }

    this.publicClient = createPublicClient({
      chain: kairos,
      transport: http(rpcUrl),
    });

    this.feePayerClient = createWalletClient({
      account: privateKeyToAccount(privateKey as Hex),
      chain: kairos, // or klaytn for mainnet
      transport: http(rpcUrl),
    });

    const studentManagerContractAddress = this.configService.get<Hex>('contract.studentManager');

    if (!studentManagerContractAddress) {
      throw new InternalServerErrorException('contract.studentManager is not configured in .env');
    }
    this.studentManagerContractAddress = studentManagerContractAddress;
  }

  async getActiveMileageTokenAddress(): Promise<Address> {
    try {
      const result = await this.publicClient.readContract({
        address: this.studentManagerContractAddress,
        abi: StudentManagerABI,
        functionName: 'mileageToken',
        args: [],
      });
      return result as Address;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get active mileage token address: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendTransactionWithFeePayerSign(rawTransaction: Hex): Promise<Hex> {
    try {
      const feePayerSignedTx = await this.feePayerClient.signTransactionAsFeePayer(rawTransaction);

      const sentFeePayerTx = await this.feePayerClient.request({
        method: 'klay_sendRawTransaction',
        params: [feePayerSignedTx],
      });

      const result = await this.publicClient.waitForTransactionReceipt({
        hash: sentFeePayerTx as Hex,
      });

      console.log('fee payer contract execution tx', result);
      return sentFeePayerTx as Hex;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new InternalServerErrorException(
        `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async addAdmin(adminWalletAddress: string): Promise<Hex> {
    //TODO: 이유는 모르겠지만, kaiachain/viem-ext 라이브러리의 public client에서
    // readContract 메소드를 읽어오지 못하는 문제가 있습니다. (정의되지 않은것으로 판단됨)
    // docs의 example에서 사용되는것으로 보아, sdk 개발 과정에서 오류가 있었던 것으로 예상되어
    // viem의 createPublicClient를 사용하였습니다.

    const isAdmin = await this.publicClient.readContract({
      address: this.studentManagerContractAddress,
      abi: StudentManagerABI,
      functionName: 'isAdmin',
      args: [adminWalletAddress],
    });

    if (isAdmin) {
      throw new BadRequestException('Address is already an admin on the blockchain');
    }

    try {
      const txHash = await this.feePayerClient.writeContract({
        address: this.studentManagerContractAddress,
        abi: StudentManagerABI,
        functionName: 'addAdmin',
        args: [adminWalletAddress],
      });
      return txHash;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
