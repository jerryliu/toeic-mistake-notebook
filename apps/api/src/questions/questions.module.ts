import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question, QuestionOption } from '../entities';
import { QuestionsController } from './questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionOption])],
  controllers: [QuestionsController],
})
export class QuestionsModule {}
