import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { QuestionStatus } from '../common/enums';
import { Question, Review } from '../entities';

export type AnalyticsRange = '7d' | '30d';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
    @InjectRepository(Review)
    private readonly reviewsRepo: Repository<Review>,
  ) {}

  async weaknesses(userId: string, rangeRaw = '7d') {
    const range = this.parseRange(rangeRaw);
    const now = new Date();
    const rangeStart = new Date(
      now.getTime() - (range === '7d' ? 7 : 30) * 24 * 60 * 60 * 1000,
    );
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const questions = await this.questionsRepo.find({ where: { userId } });
    const readyQuestions = questions.filter(
      (q) => q.status === QuestionStatus.Ready,
    );

    const reviewsInRange = await this.reviewsRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.reviewed_at >= :start', { start: rangeStart })
      .orderBy('r.reviewed_at', 'ASC')
      .getMany();

    const reviewsLast7d = await this.reviewsRepo
      .createQueryBuilder('r')
      .where('r.user_id = :userId', { userId })
      .andWhere('r.reviewed_at >= :start', { start: sevenDaysAgo })
      .getCount();

    const byPart = this.buildByPart(readyQuestions, reviewsInRange);
    const byErrorType = this.buildErrorTypeDistribution(readyQuestions);
    const streak = this.buildStreakStats(readyQuestions, reviewsInRange);
    const dueCount = readyQuestions.filter(
      (q) => q.nextReviewAt && q.nextReviewAt <= now,
    ).length;
    const pendingDraftCount = questions.filter(
      (q) =>
        q.status === QuestionStatus.Draft ||
        q.status === QuestionStatus.PendingAnalysis,
    ).length;

    const topWeaknesses = [...byErrorType]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((row) => ({
        errorType: row.errorType,
        count: row.count,
        label: this.errorTypeLabel(row.errorType),
      }));

    const summaryLine =
      topWeaknesses.length === 0
        ? '目前還沒有足夠的錯題資料。先輸入幾題並完成複習。'
        : `你最近最常在「${topWeaknesses.map((t) => t.label).join('、')}」失分。`;

    return {
      range,
      asOf: now.toISOString(),
      summaryLine,
      byPart,
      byErrorType,
      reviews: {
        inRange: reviewsInRange.length,
        last7Days: reviewsLast7d,
      },
      streak,
      queue: {
        dueCount,
        readyCount: readyQuestions.length,
        pendingDraftCount,
        totalQuestions: questions.length,
      },
      topWeaknesses,
    };
  }

  private parseRange(raw: string): AnalyticsRange {
    if (raw === '7d' || raw === '30d') return raw;
    throw new BadRequestException('range 必須是 7d 或 30d');
  }

  private buildByPart(questions: Question[], reviews: Review[]) {
    const parts = [5, 6, 7] as const;
    const reviewsByQuestion = new Map<string, Review[]>();
    for (const review of reviews) {
      const list = reviewsByQuestion.get(review.questionId) ?? [];
      list.push(review);
      reviewsByQuestion.set(review.questionId, list);
    }

    return parts.map((part) => {
      const partQuestions = questions.filter((q) => q.part === part);
      const partReviews = partQuestions.flatMap(
        (q) => reviewsByQuestion.get(q.id) ?? [],
      );
      const correct = partReviews.filter((r) => !!r.isCorrect).length;
      const total = partReviews.length;
      return {
        part,
        questionCount: partQuestions.length,
        reviewCount: total,
        correctCount: correct,
        accuracy: total === 0 ? null : Number((correct / total).toFixed(3)),
      };
    });
  }

  private buildErrorTypeDistribution(questions: Question[]) {
    const counts = new Map<string, number>();
    for (const q of questions) {
      if (!q.errorType) continue;
      counts.set(q.errorType, (counts.get(q.errorType) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return [...counts.entries()]
      .map(([errorType, count]) => ({
        errorType,
        label: this.errorTypeLabel(errorType),
        count,
        share: Number((count / total).toFixed(3)),
      }))
      .sort((a, b) => b.count - a.count);
  }

  private buildStreakStats(questions: Question[], reviews: Review[]) {
    const maxRepetition = questions.reduce(
      (max, q) => Math.max(max, q.repetitionCount ?? 0),
      0,
    );
    const questionsWithStreak3 = questions.filter(
      (q) => (q.repetitionCount ?? 0) >= 3,
    ).length;

    // Current consecutive correct reviews across all recent activity (newest first).
    const chronological = [...reviews].sort(
      (a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime(),
    );
    let currentCorrectStreak = 0;
    for (const review of chronological) {
      if (review.isCorrect) currentCorrectStreak += 1;
      else break;
    }

    let bestCorrectStreak = 0;
    let running = 0;
    for (const review of [...reviews].sort(
      (a, b) => a.reviewedAt.getTime() - b.reviewedAt.getTime(),
    )) {
      if (review.isCorrect) {
        running += 1;
        bestCorrectStreak = Math.max(bestCorrectStreak, running);
      } else {
        running = 0;
      }
    }

    return {
      maxRepetitionOnCard: maxRepetition,
      cardsAtStreak3Plus: questionsWithStreak3,
      currentCorrectStreak,
      bestCorrectStreakInRange: bestCorrectStreak,
    };
  }

  private errorTypeLabel(errorType: string): string {
    const map: Record<string, string> = {
      vocab: '單字不熟',
      pos: '詞性判斷',
      collocation: '固定搭配',
      grammar: '文法規則',
      meaning: '句意理解',
      locate: '題目定位',
      time: '時間不足',
      careless: '粗心',
      distract: '干擾項誤導',
    };
    return map[errorType] ?? errorType;
  }

  /** Helper for smoke tests / demos — not exposed publicly. */
  async countDue(userId: string) {
    const now = new Date();
    return this.questionsRepo.count({
      where: {
        userId,
        status: QuestionStatus.Ready,
        nextReviewAt: LessThanOrEqual(now),
      },
    });
  }
}
