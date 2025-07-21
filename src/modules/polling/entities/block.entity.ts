import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('block')
export class Block {
  @PrimaryColumn({ default: 'last_processed_block' })
  key: string;

  @Column({ length: 256, default: '0' })
  block_number: string;
}
