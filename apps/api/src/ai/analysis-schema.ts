import { z } from 'zod';
import { ErrorType } from '../common/enums';
import { AnalyzeQuestionResult } from './english-question-analyzer.interface';

export const analyzeQuestionResultSchema = z.object({
  questionType: z.string().min(1),
  correctExplanation: z.string().min(1),
  distractorExplanations: z.record(z.string(), z.string()),
  errorType: z.nativeEnum(ErrorType),
  vocabTags: z.array(z.string()),
  grammarTags: z.array(z.string()),
  similarExamples: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export function validateAnalyzeResult(
  raw: unknown,
): AnalyzeQuestionResult {
  return analyzeQuestionResultSchema.parse(raw);
}
