import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  @Get('weaknesses')
  @ApiQuery({ name: 'range', required: false, example: '7d' })
  @ApiOkResponse({ description: 'Phase 1 scaffold stub' })
  weaknesses(@Query('range') range = '7d') {
    return {
      range,
      byPart: [],
      byErrorType: [],
      message: '弱點統計將於後續里程碑實作',
    };
  }
}
