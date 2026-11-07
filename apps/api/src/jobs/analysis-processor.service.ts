import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validateAnalyzeResult } from '../ai/analysis-schema';
import {
  ENGLISH_QUESTION_ANALYZER,
  type EnglishQuestionAnalyzer,
} from '../ai/english-question-analyzer.interface';
import { OCR_PROVIDER, type OcrProvider } from '../ai/ocr-provider.interface';
import {
  AnalysisJobStatus,
  AnalysisJobType,
  QuestionStatus,
} from '../common/enums';
import {
  AnalysisJob,
  Question,
  QuestionAnalysis,
  QuestionOption,
} from '../entities';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisJobPayload,
  JobQueueService,
} from './job-queue.service';

@Injectable()
export class AnalysisProcessorService implements OnModuleInit {
  private readonly logger = new Logger(AnalysisProcessorService.name);

  constructor(
    private readonly queue: JobQueueService,
    @Inject(ENGLISH_QUESTION_ANALYZER)
    private readonly analyzer: EnglishQuestionAnalyzer,
    @Inject(OCR_PROVIDER)
    private readonly ocr: OcrProvider,
    @InjectRepository(AnalysisJob)
    private readonly jobsRepo: Repository<AnalysisJob>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionsRepo: Repository<QuestionOption>,
    @InjectRepository(QuestionAnalysis)
    private readonly analysesRepo: Repository<QuestionAnalysis>,
  ) {}

  onModuleInit() {
    this.queue.setHandler((payload) => this.process(payload));
  }

  async process(payload: AnalysisJobPayload): Promise<void> {
    const job = await this.jobsRepo.findOne({ where: { id: payload.jobId } });
    if (!job) {
      this.logger.warn(`Job ${payload.jobId} not found`);
      return;
    }

    job.status = AnalysisJobStatus.Running;
    job.attempts += 1;
    job.startedAt = new Date();
    await this.jobsRepo.save(job);

    try {
      if (payload.jobType === AnalysisJobType.Ocr) {
        await this.runOcr(job, payload);
      } else {
        await this.runAnalyze(job, payload);
      }
      job.status = AnalysisJobStatus.Succeeded;
      job.finishedAt = new Date();
      await this.jobsRepo.save(job);
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Job ${job.id} failed: ${message}`, (err as Error).stack);
      job.status = AnalysisJobStatus.Failed;
      job.errorMessage = message;
      job.finishedAt = new Date();
      await this.jobsRepo.save(job);

      if (payload.jobType === AnalysisJobType.Analyze) {
        await this.questionsRepo.update(payload.questionId, {
          status: QuestionStatus.Failed,
        });
      }
    }
  }

  private async runOcr(job: AnalysisJob, payload: AnalysisJobPayload) {
    if (!payload.imagePath) {
      throw new Error('OCR job missing imagePath');
    }
    const result = await this.ocr.extractText({ imagePath: payload.imagePath });
    const question = await this.questionsRepo.findOneOrFail({
      where: { id: payload.questionId },
    });
    question.sourceText = result.text;
    question.stem = question.stem ?? this.guessStem(result.text);
    question.status = QuestionStatus.Draft;
    await this.questionsRepo.save(question);

    const parsedOptions = this.guessOptions(result.text);
    if (parsedOptions.length > 0) {
      await this.optionsRepo.delete({ questionId: question.id });
      await this.optionsRepo.save(
        parsedOptions.map((opt, idx) =>
          this.optionsRepo.create({
            id: uuidv4(),
            questionId: question.id,
            label: opt.label,
            content: opt.content,
            sortOrder: idx,
          }),
        ),
      );
    }

    job.resultJson = {
      text: result.text,
      confidence: result.confidence,
      provider: result.provider,
    };
  }

  private async runAnalyze(job: AnalysisJob, payload: AnalysisJobPayload) {
    const question = await this.questionsRepo.findOneOrFail({
      where: { id: payload.questionId },
    });
    const options = await this.optionsRepo.find({
      where: { questionId: question.id },
      order: { sortOrder: 'ASC' },
    });

    const raw = await this.analyzer.analyze({
      stem: question.stem ?? question.sourceText ?? '',
      options: options.map((o) => ({ label: o.label, content: o.content })),
      correctOption: question.correctOption,
      userOption: question.userOption,
      part: question.part,
    });
    const validated = validateAnalyzeResult(raw);

    let analysis = await this.analysesRepo.findOne({
      where: { questionId: question.id },
    });
    if (!analysis) {
      analysis = this.analysesRepo.create({
        id: uuidv4(),
        questionId: question.id,
      });
    }
    analysis.questionType = validated.questionType;
    analysis.correctExplanation = validated.correctExplanation;
    analysis.distractorExplanations = validated.distractorExplanations;
    analysis.errorType = validated.errorType;
    analysis.vocabTags = validated.vocabTags;
    analysis.grammarTags = validated.grammarTags;
    analysis.similarExamples = validated.similarExamples;
    analysis.confidence = String(validated.confidence);
    analysis.rawJson = validated as unknown as Record<string, unknown>;
    await this.analysesRepo.save(analysis);

    if (!question.errorType) {
      question.errorType = validated.errorType;
    }
    // After AI: wait for human confirm — keep draft-ish ready-for-confirm state.
    question.status = QuestionStatus.Draft;
    await this.questionsRepo.save(question);

    job.resultJson = validated as unknown as Record<string, unknown>;
  }

  private guessStem(text: string): string {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^\([A-D]\)/i.test(l) && !/^\[Mock OCR\]/.test(l));
    return lines[0] ?? text.slice(0, 280);
  }

  private guessOptions(
    text: string,
  ): Array<{ label: string; content: string }> {
    const matches = [...text.matchAll(/\(([A-D])\)\s*(.+)/gi)];
    return matches.map((m) => ({
      label: m[1].toUpperCase(),
      content: m[2].trim(),
    }));
  }
}
