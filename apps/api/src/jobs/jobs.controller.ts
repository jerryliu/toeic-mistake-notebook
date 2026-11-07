import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { JobsService } from './jobs.service';
import { JobQueueService } from './job-queue.service';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly queue: JobQueueService,
  ) {}

  @Get('queue/mode')
  @ApiOkResponse({ description: 'bullmq | inline' })
  queueMode() {
    return { mode: this.queue.getMode() };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Job status' })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.jobsService.getJob(id, user.id);
  }
}
