import { Module } from '@nestjs/common';
import { ENGLISH_QUESTION_ANALYZER } from './english-question-analyzer.interface';
import { MockEnglishQuestionAnalyzer } from './mock-english-question-analyzer';

@Module({
  providers: [
    MockEnglishQuestionAnalyzer,
    {
      provide: ENGLISH_QUESTION_ANALYZER,
      useExisting: MockEnglishQuestionAnalyzer,
    },
  ],
  exports: [ENGLISH_QUESTION_ANALYZER, MockEnglishQuestionAnalyzer],
})
export class AiModule {}
