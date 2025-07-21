import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MileageFile } from '../entities/mileage-file.entity';
import { CreateMileageFileParams } from '../mileage.types';

@Injectable()
export class MileageFileRepository extends Repository<MileageFile> {
  constructor(private readonly dataSource: DataSource) {
    super(MileageFile, dataSource.createEntityManager());
  }

  async createMileageFiles(data: CreateMileageFileParams[]): Promise<MileageFile[]> {
    const newMileageFiles = this.create(data);
    return this.save(newMileageFiles);
  }
}
