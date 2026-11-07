import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisJob } from '../entities';
import { JobsController } from './jobs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalysisJob])],
  controllers: [JobsController],
})
export class JobsModule {}
