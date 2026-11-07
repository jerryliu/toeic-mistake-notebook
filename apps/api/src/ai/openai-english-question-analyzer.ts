import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateAnalyzeResult } from './analysis-schema';
import {
  AnalyzeQuestionInput,
  AnalyzeQuestionResult,
  EnglishQuestionAnalyzer,
} from './english-question-analyzer.interface';

/**
 * Optional OpenAI-compatible analyzer. Used only when OPENAI_API_KEY is set.
 */
@Injectable()
export class OpenAiEnglishQuestionAnalyzer implements EnglishQuestionAnalyzer {
  private readonly logger = new Logger(OpenAiEnglishQuestionAnalyzer.name);

  constructor(private readonly config: ConfigService) {}

  async analyze(input: AnalyzeQuestionInput): Promise<AnalyzeQuestionResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    const baseUrl =
      this.config.get<string>('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1';
    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

    const prompt = {
      role: 'user',
      content: [
        'You are a TOEIC reading tutor. Return ONLY JSON matching this schema:',
        'questionType, correctExplanation, distractorExplanations{A..D}, errorType',
        '(vocab|pos|collocation|grammar|meaning|locate|time|careless|distract),',
        'vocabTags[], grammarTags[], similarExamples[], confidence 0..1',
        '',
        `Part: ${input.part ?? 'unknown'}`,
        `Stem: ${input.stem}`,
        `Options: ${JSON.stringify(input.options)}`,
        `Correct: ${input.correctOption ?? 'unknown'}`,
        `User answered: ${input.userOption ?? 'unknown'}`,
      ].join('\n'),
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Respond with a single JSON object only.',
          },
          prompt,
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`OpenAI error ${res.status}: ${body}`);
      throw new Error(`OpenAI request failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }
    return validateAnalyzeResult(JSON.parse(content));
  }
}
