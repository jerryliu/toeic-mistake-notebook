import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './ai/ai.module';
import { AnalysesModule } from './analyses/analyses.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import {
  AnalysisJob,
  Question,
  QuestionAnalysis,
  QuestionOption,
  Review,
  User,
} from './entities';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { QuestionsModule } from './questions/questions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';

const entities = [
  User,
  Question,
  QuestionOption,
  QuestionAnalysis,
  Review,
  AnalysisJob,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Local smoke without Docker MySQL. Production path uses MySQL + sql/001_init.sql.
        if (config.get('SKIP_DB') === '1') {
          return {
            type: 'better-sqlite3' as const,
            database: ':memory:',
            entities,
            synchronize: true,
            logging: false,
          };
        }
        return {
          type: 'mysql' as const,
          url:
            config.get<string>('DATABASE_URL') ??
            'mysql://toeic:toeic_pass@localhost:3306/toeic',
          entities,
          synchronize: false,
          logging: config.get('TYPEORM_LOGGING') === '1',
        };
      },
    }),
    CommonModule,
    HealthModule,
    UsersModule,
    AuthModule,
    QuestionsModule,
    AnalysesModule,
    ReviewsModule,
    AnalyticsModule,
    AiModule,
    JobsModule,
  ],
})
export class AppModule {}
