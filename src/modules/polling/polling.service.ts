import { fallback, FallbackTransport, Hex, http, kairos, PublicClient } from '@kaiachain/viem-ext';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createPublicClient } from 'viem';

import { EventService } from './event.service';
import { BlockRepository } from './repository/block.repository';

@Injectable()
export class PollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PollingService.name);
  private httpProvider: PublicClient<FallbackTransport>;
  private confirmationBlockCount = 3n;
  private studentManagerContractAddress: Hex;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventService: EventService,
    private readonly blockRepository: BlockRepository,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing viem public client for polling...');

    this.initHttpProvider();

    const lastProcessedBlockNumber: bigint = await this.blockRepository.getLastProcessedBlock();
    if (lastProcessedBlockNumber === 0n) {
      this.logger.log('No last processed block found, starting from the latest block');
      const latestBlock = await this.httpProvider.getBlockNumber();
      await this.blockRepository.setLastProcessedBlock(latestBlock);
    }

    this.studentManagerContractAddress =
      this.configService.getOrThrow<Hex>('contract.studentManager');
  }

  onModuleDestroy() {
    this.logger.log('Stopping polling...');
  }

  private initHttpProvider(): void {
    const httpTransports = [
      'https://public-en-kairos.node.kaia.io',
      'https://kaia-kairos.blockpi.network/v1/rpc/public',
      'https://responsive-green-emerald.kaia-kairos.quiknode.pro/',
    ].map((url) => http(url));

    this.httpProvider = createPublicClient<FallbackTransport>({
      chain: kairos,
      transport: fallback(httpTransports),
    });
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleConfirmationPolling() {
    try {
      const latestBlock = await this.httpProvider.getBlockNumber();
      const confirmBlock = latestBlock - this.confirmationBlockCount;
      const lastProcessedBlockNumber: bigint = await this.blockRepository.getLastProcessedBlock();

      if (confirmBlock <= lastProcessedBlockNumber) {
        this.logger.debug(
          `No new confirmed blocks to process. Last processed: ${lastProcessedBlockNumber}, Current confirmed: ${confirmBlock}`,
        );
        return;
      }

      const fromBlock = lastProcessedBlockNumber + 1n;
      const toBlock = confirmBlock;

      await this.getLogsWithFallback(fromBlock, toBlock);
      await this.blockRepository.setLastProcessedBlock(toBlock);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error during confirmation polling:', error.message, error.stack);
      } else {
        this.logger.error('An unknown error occurred during confirmation polling.', error);
      }
    }
  }

  private async getLogsWithFallback(fromBlock: bigint, toBlock: bigint): Promise<void> {
    this.logger.log(`Running confirmation poll from block ${fromBlock} to ${toBlock}`);

    const logs = await this.httpProvider.getLogs({
      address: [this.studentManagerContractAddress],
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      await this.eventService.routeEventHandler(log);
    }
  }
}
