import { Controller, Get, Query } from '@nestjs/common';
import { MileagePointHistoryService } from './mileage-point-history.service';
import { ApiTags } from '@nestjs/swagger';
import { GetMileagePointHistoriesRequest } from './dto/request/get-mileage-point-history.dto';
import { plainToInstance } from 'class-transformer';
import { BaseMileagePointHistoryDto } from './dto/response/base-mileage-point-history.dto';

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
