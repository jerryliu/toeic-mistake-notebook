import { ErrorType } from '../common/enums';

export interface AnalyzeQuestionInput {
  stem: string;
  options: Array<{ label: string; content: string }>;
  correctOption?: string | null;
  userOption?: string | null;
  part?: number | null;
}

export interface AnalyzeQuestionResult {
  questionType: string;
  correctExplanation: string;
  distractorExplanations: Record<string, string>;
  errorType: ErrorType;
  vocabTags: string[];
  grammarTags: string[];
  similarExamples: string[];
  confidence: number;
}

/**
 * Provider-agnostic AI contract. Questions modules depend on this token,
 * never on a concrete LLM vendor.
 */
export interface EnglishQuestionAnalyzer {
  analyze(input: AnalyzeQuestionInput): Promise<AnalyzeQuestionResult>;
}

export const ENGLISH_QUESTION_ANALYZER = Symbol('ENGLISH_QUESTION_ANALYZER');
