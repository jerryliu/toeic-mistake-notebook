import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOkResponse({ description: 'Liveness / readiness smoke' })
  check() {
    const key = this.config.get('SKIP_DB') === '1' ? 'sqlite' : 'mysql';
    return this.health.check([() => this.db.pingCheck(key)]);
  }
}
