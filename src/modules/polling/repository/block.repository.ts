import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Block } from '../entities/block.entity';

@Injectable()
export class BlockRepository extends Repository<Block> {
  constructor(private dataSource: DataSource) {
    super(Block, dataSource.createEntityManager());
  }

  async getLastProcessedBlock(): Promise<bigint> {
    const lastBlock = await this.findOne({
      where: { key: 'last_processed_block' },
    });
    return lastBlock ? BigInt(lastBlock.block_number) : 0n;
  }

  async setLastProcessedBlock(blockNumber: bigint): Promise<void> {
    await this.upsert(
      { key: 'last_processed_block', block_number: blockNumber.toString() },
      { conflictPaths: ['key'] },
    );
  }
}
