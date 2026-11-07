import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionAnalysis } from '../entities';
import { AnalysesController } from './analyses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionAnalysis])],
  controllers: [AnalysesController],
})
export class AnalysesModule {}
