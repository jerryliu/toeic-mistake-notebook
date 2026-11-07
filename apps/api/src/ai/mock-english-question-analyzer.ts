import { Injectable } from '@nestjs/common';
import { ErrorType } from '../common/enums';
import {
  AnalyzeQuestionInput,
  AnalyzeQuestionResult,
  EnglishQuestionAnalyzer,
} from './english-question-analyzer.interface';

@Injectable()
export class MockEnglishQuestionAnalyzer implements EnglishQuestionAnalyzer {
  async analyze(input: AnalyzeQuestionInput): Promise<AnalyzeQuestionResult> {
    const correct = input.correctOption ?? 'A';
    const distractors: Record<string, string> = {};
    for (const opt of input.options) {
      if (opt.label !== correct) {
        distractors[opt.label] = `（Mock）選項 ${opt.label} 為何不正確的佔位說明。`;
      }
    }

    return {
      questionType: input.part === 5 ? 'part5_grammar_vocab' : 'general_reading',
      correctExplanation: `（Mock）正解 ${correct}：依題幹語境選擇最合適的答案。`,
      distractorExplanations: distractors,
      errorType:
        input.userOption && input.userOption !== correct
          ? ErrorType.Vocab
          : ErrorType.Careless,
      vocabTags: ['mock-vocab'],
      grammarTags: ['mock-grammar'],
      similarExamples: [
        'The manager insisted that the report be submitted by Friday.',
      ],
      confidence: 0.42,
    };
  }
}
