import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('api/v1/reviews')
export class ReviewsController {
  @Get('today')
  @ApiOkResponse({ description: 'Phase 1 scaffold stub' })
  today() {
    return { items: [], message: '今日複習將於後續里程碑實作' };
  }
}
