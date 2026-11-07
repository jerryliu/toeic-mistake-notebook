import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('analyses')
@Controller('api/v1/analyses')
export class AnalysesController {
  @Get()
  @ApiOkResponse({ description: 'Phase 1 scaffold stub' })
  list() {
    return { items: [], message: 'Analyses API 將於後續里程碑實作' };
  }
}
