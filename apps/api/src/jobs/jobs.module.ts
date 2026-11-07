import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import {
  AnalysisJob,
  Question,
  QuestionAnalysis,
  QuestionOption,
} from '../entities';
import { AnalysisProcessorService } from './analysis-processor.service';
import { JobQueueService } from './job-queue.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnalysisJob,
      Question,
      QuestionOption,
      QuestionAnalysis,
    ]),
    AiModule,
  ],
  controllers: [JobsController],
  providers: [JobQueueService, JobsService, AnalysisProcessorService],
  exports: [JobsService, JobQueueService],
})
export class JobsModule {}
