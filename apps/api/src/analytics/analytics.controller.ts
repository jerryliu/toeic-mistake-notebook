import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weaknesses')
  @ApiQuery({ name: 'range', required: false, example: '7d' })
  @ApiOkResponse({ description: 'Weakness stats for the selected range' })
  weaknesses(
    @CurrentUser() user: AuthUser,
    @Query('range') range = '7d',
  ) {
    return this.analyticsService.weaknesses(user.id, range);
  }
}
