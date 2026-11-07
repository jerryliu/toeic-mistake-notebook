import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ENGLISH_QUESTION_ANALYZER } from './english-question-analyzer.interface';
import { MockEnglishQuestionAnalyzer } from './mock-english-question-analyzer';
import { MockOcrProvider } from './mock-ocr-provider';
import { OCR_PROVIDER } from './ocr-provider.interface';
import { OpenAiEnglishQuestionAnalyzer } from './openai-english-question-analyzer';

@Module({
  imports: [ConfigModule],
  providers: [
    MockEnglishQuestionAnalyzer,
    OpenAiEnglishQuestionAnalyzer,
    MockOcrProvider,
    {
      provide: ENGLISH_QUESTION_ANALYZER,
      inject: [
        ConfigService,
        MockEnglishQuestionAnalyzer,
        OpenAiEnglishQuestionAnalyzer,
      ],
      useFactory: (
        config: ConfigService,
        mock: MockEnglishQuestionAnalyzer,
        openai: OpenAiEnglishQuestionAnalyzer,
      ) => (config.get<string>('OPENAI_API_KEY') ? openai : mock),
    },
    {
      provide: OCR_PROVIDER,
      useExisting: MockOcrProvider,
    },
  ],
  exports: [
    ENGLISH_QUESTION_ANALYZER,
    OCR_PROVIDER,
    MockEnglishQuestionAnalyzer,
    MockOcrProvider,
  ],
})
export class AiModule {}
