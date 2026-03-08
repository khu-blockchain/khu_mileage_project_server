import { createWalletClient, Hex, http, kairos, privateKeyToAccount } from '@kaiachain/viem-ext';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Address, createPublicClient, keccak256, toBytes } from 'viem';
import { decodeFunctionData, parseTransaction } from '@kaiachain/viem-ext';

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

      return sentFeePayerTx as Hex;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new InternalServerErrorException(
        `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendFeepayerSignedTransaction(feePayerSignedTx: Hex): Promise<Hex> {
    try {
      const sentFeePayerTx = await this.feePayerClient.request({
        method: 'klay_sendRawTransaction',
        params: [feePayerSignedTx],
      });
      return sentFeePayerTx as Hex;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw new InternalServerErrorException(
        `Failed to send transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async calcTxHashFromRawTransaction(
    rawTransaction: Hex,
  ): Promise<{ txHash: Hex; feePayerSignedTx: Hex }> {
    try {
      const feePayerSignedTx = (await this.feePayerClient.signTransactionAsFeePayer(
        rawTransaction,
      )) as Hex;
      const txHash = keccak256(toBytes(feePayerSignedTx as Hex));
      return { txHash, feePayerSignedTx };
    } catch (error) {
      console.error('Failed to calculate transaction hash:', error);
      throw new InternalServerErrorException(
        `Failed to calculate transaction hash: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async validateStudentManagerTransaction(
    rawTransaction: Hex,
    expectedWalletAddress: Address,
    expectedFunctionName: string,
    expectedArg0: string,
  ): Promise<void> {
    // 1. from 주소가 서버에 전송된 지갑 주소(혹은 등록된 주소와 같은지 확인)
    // 2. to 주소가 StudentManager 컨트랙트 주소와 같은지 확인
    // 3. 호출하는 함수 이름이 expectedFunctionName과 같은지 확인 (e.g., submitDocument)
    // 4. 호출하는 함수의 첫번째 인자가 expectedArg0와 같은지 확인 (e.g., submitDocument(docHash) -> docHash is expected arg0)
    try {
      const txData = await this.parseRawTransaction(rawTransaction);
      // console.log('txData', txData);
      
      if (txData.from.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
        throw new BadRequestException(
          `Transaction sender address mismatch. Expected: ${expectedWalletAddress}, got: ${txData.from}`,
        );
      }

      if (txData.to.toLowerCase() !== this.studentManagerContractAddress.toLowerCase()) {
        throw new BadRequestException(
          `Invalid contract address. Expected StudentManager contract: ${this.studentManagerContractAddress}, got: ${txData.to}`,
        );
      }

      const decodedData = decodeFunctionData({
        abi: StudentManagerABI,
        data: txData.data,
      });

      if (decodedData.functionName !== expectedFunctionName) {
        throw new BadRequestException(
          `Function name mismatch. Expected: ${expectedFunctionName}, got: ${decodedData.functionName}`,
        );
      }

      if (!decodedData.args || decodedData.args.length === 0) {
        throw new BadRequestException(`No arguments found in ${expectedFunctionName} function call`);
      }
      
      const firstArg = decodedData.args[0] as string;
      if (firstArg !== expectedArg0) {
        throw new BadRequestException(
          `First argument mismatch in ${expectedFunctionName}. Expected: ${expectedArg0}, got: ${firstArg}`,
        );
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Transaction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  
  async validateStudentManagerFunction(parsedRawTransaction: Hex, expectedFunctionName: string) {
    // tx가 호출하는 컨트랙트 주소 (tx.to)와 호출하는 함수 이름을 검증
    // validateStudentManagerTransaction 에서는 tx.from 과 컨트랙트 호출 인자까지 검증
    try {
      const txData = await this.parseRawTransaction(parsedRawTransaction);
      if (txData.to.toLowerCase() !== this.studentManagerContractAddress.toLowerCase()) {
        throw new BadRequestException(
          `Invalid contract address. Expected StudentManager contract: ${this.studentManagerContractAddress}, got: ${txData.to}`,
        );
      }
      const decodedData = decodeFunctionData({
        abi: StudentManagerABI,
        data: txData.data,
      });
      if (decodedData.functionName !== expectedFunctionName) {
        throw new BadRequestException(
          `Function name mismatch. Expected: ${expectedFunctionName}, got: ${decodedData.functionName}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Function validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async parseRawTransaction(rawTransaction: Hex): Promise<{
    from: Address;
    to: Address;
    data: Hex;
  }> {
    try {
      const parsedTx = parseTransaction(rawTransaction);

      if (!parsedTx.from) {
        throw new InternalServerErrorException('Transaction does not have a from address');
      }

      if (!parsedTx.to) {
        throw new InternalServerErrorException('Transaction does not have a to address');
      }

      if (!parsedTx.data) {
        throw new InternalServerErrorException('Transaction does not have data field');
      }

      return {
        from: parsedTx.from as Hex,
        to: parsedTx.to as Hex,
        data: parsedTx.data as Hex,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to parse raw transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
