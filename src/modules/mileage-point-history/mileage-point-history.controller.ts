import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { BaseMileagePointHistoryDto, GetMileagePointHistoriesRequest } from './dto';
import { MileagePointHistoryService } from './mileage-point-history.service';

@ApiTags('Mileage Point History API (Not Implemented)')
@Controller('mileage-point-history')
export class MileagePointHistoryController {
  constructor(private readonly mileagePointHistoryService: MileagePointHistoryService) {}

  @Get()
  async getMileagePointHistories(@Query() query: GetMileagePointHistoriesRequest) {
    const { mileagePointHistories, total } =
      await this.mileagePointHistoryService.getMileagePointHistories(query);

    return {
      data: plainToInstance(BaseMileagePointHistoryDto, mileagePointHistories, {
        excludeExtraneousValues: true,
      }),
      meta: {
        total,
        lastPage: Math.ceil(total / query.limit),
      },
    };
  }
}
