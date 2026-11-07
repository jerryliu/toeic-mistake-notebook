import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('jobs')
@Controller('api/v1/jobs')
export class JobsController {
  @Get(':id')
  @ApiOkResponse({ description: 'Phase 1 scaffold stub' })
  get(@Param('id') id: string) {
    return {
      id,
      status: 'queued',
      message: 'BullMQ worker 將於後續里程碑接上',
    };
  }
}
