import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('questions')
@Controller('api/v1/questions')
export class QuestionsController {
  @Get()
  @ApiOkResponse({ description: 'Phase 1 scaffold stub' })
  list() {
    return {
      items: [],
      message: 'Questions CRUD 將於後續里程碑實作',
    };
  }
}
