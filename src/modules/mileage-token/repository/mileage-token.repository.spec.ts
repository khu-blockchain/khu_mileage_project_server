import { Test, TestingModule } from '@nestjs/testing';
import { MileageTokenRepository } from './mileage-token.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MileageToken } from '../entities/mileage-token.entity';

describe('MileageTokenRepository', () => {
  let repository: MileageTokenRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MileageTokenRepository,
        {
          provide: getRepositoryToken(MileageToken),
          useValue: {},
        },
      ],
    }).compile();

    repository = module.get<MileageTokenRepository>(MileageTokenRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
