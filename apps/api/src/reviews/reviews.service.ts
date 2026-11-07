import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { QuestionStatus, ReviewConfidence } from '../common/enums';
import {
  Question,
  QuestionAnalysis,
  QuestionOption,
  Review,
} from '../entities';
import { CreateReviewDto } from './dto/create-review.dto';
import { computeNextSchedule } from './schedule';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionsRepo: Repository<QuestionOption>,
    @InjectRepository(QuestionAnalysis)
    private readonly analysesRepo: Repository<QuestionAnalysis>,
  ) {}

  async today(userId: string) {
    const now = new Date();
    const due = await this.questionsRepo.find({
      where: {
        userId,
        status: QuestionStatus.Ready,
        nextReviewAt: LessThanOrEqual(now),
      },
      order: { nextReviewAt: 'ASC' },
      take: 50,
    });

    const items = await Promise.all(
      due.map(async (question) => {
        const options = await this.optionsRepo.find({
          where: { questionId: question.id },
          order: { sortOrder: 'ASC' },
        });
        const analysis = await this.analysesRepo.findOne({
          where: { questionId: question.id },
        });
        return {
          prompt: {
            id: question.id,
            stem: question.stem,
            part: question.part,
            status: question.status,
            nextReviewAt: question.nextReviewAt,
            imageUrl: question.imageUrl,
            repetitionCount: question.repetitionCount,
            intervalDays: question.intervalDays,
          },
          options: options.map((o) => ({
            label: o.label,
            content: o.content,
          })),
          // Hidden by UI until the learner answers; included to avoid a second round-trip.
          reveal: {
            correctOption: question.correctOption,
            originalUserOption: question.userOption,
            errorType: question.errorType ?? analysis?.errorType ?? null,
            analysis: analysis
              ? {
                  questionType: analysis.questionType,
                  correctExplanation: analysis.correctExplanation,
                  distractorExplanations: analysis.distractorExplanations,
                  errorType: analysis.errorType,
                  vocabTags: analysis.vocabTags,
                  grammarTags: analysis.grammarTags,
                  similarExamples: analysis.similarExamples,
                }
              : null,
          },
        };
      }),
    );

    return { items, count: items.length, asOf: now.toISOString() };
  }

  async createReview(questionId: string, userId: string, dto: CreateReviewDto) {
    const question = await this.questionsRepo.findOne({
      where: { id: questionId, userId },
    });
    if (!question) {
      throw new NotFoundException('找不到題目');
    }
    if (question.status !== QuestionStatus.Ready) {
      throw new BadRequestException('題目尚未確認加入複習');
    }
    if (!question.correctOption) {
      throw new BadRequestException('題目缺少正解');
    }

    const now = new Date();
    const isCorrect = dto.recalledOption === question.correctOption;
    this.assertConfidenceMatches(dto.confidence, isCorrect);

    const schedule = computeNextSchedule({
      confidence: dto.confidence,
      previousRepetitionCount: question.repetitionCount ?? 0,
      now,
    });

    const review = this.reviewsRepo.create({
      id: uuidv4(),
      questionId,
      userId,
      recalledOption: dto.recalledOption,
      isCorrect,
      confidence: dto.confidence,
      reasonNote: dto.reasonNote?.trim() || null,
      intervalDays: schedule.intervalDays,
      nextReviewAt: schedule.nextReviewAt,
      reviewedAt: now,
    });
    await this.reviewsRepo.save(review);

    question.intervalDays = schedule.intervalDays;
    question.repetitionCount = schedule.repetitionCount;
    question.nextReviewAt = schedule.nextReviewAt;
    await this.questionsRepo.save(question);

    const analysis = await this.analysesRepo.findOne({
      where: { questionId },
    });

    return {
      review,
      question: {
        id: question.id,
        status: question.status,
        nextReviewAt: question.nextReviewAt,
        intervalDays: question.intervalDays,
        repetitionCount: question.repetitionCount,
      },
      reveal: {
        correctOption: question.correctOption,
        originalUserOption: question.userOption,
        errorType: question.errorType ?? analysis?.errorType ?? null,
        isCorrect,
        analysis: analysis
          ? {
              correctExplanation: analysis.correctExplanation,
              distractorExplanations: analysis.distractorExplanations,
              errorType: analysis.errorType,
            }
          : null,
      },
    };
  }

  private assertConfidenceMatches(
    confidence: ReviewConfidence,
    isCorrect: boolean,
  ) {
    const correctLabels = [
      ReviewConfidence.CorrectUnsure,
      ReviewConfidence.CorrectConfident,
    ];
    const wrongLabels = [
      ReviewConfidence.Forgot,
      ReviewConfidence.WrongFamiliar,
    ];
    if (isCorrect && wrongLabels.includes(confidence)) {
      throw new BadRequestException(
        '本次回憶正確，請選擇「答對但不確定」或「答對且很熟」',
      );
    }
    if (!isCorrect && correctLabels.includes(confidence)) {
      throw new BadRequestException(
        '本次回憶不正確，請選擇「不會」或「答錯」',
      );
    }
  }
}
