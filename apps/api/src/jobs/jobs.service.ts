import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisJobStatus,
  AnalysisJobType,
  QuestionStatus,
} from '../common/enums';
import { AnalysisJob, Question } from '../entities';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly queue: JobQueueService,
    @InjectRepository(AnalysisJob)
    private readonly jobsRepo: Repository<AnalysisJob>,
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
  ) {}

  async enqueueAnalyze(questionId: string, userId: string) {
    const question = await this.questionsRepo.findOne({
      where: { id: questionId, userId },
    });
    if (!question) {
      throw new NotFoundException('找不到題目');
    }

    question.status = QuestionStatus.PendingAnalysis;
    await this.questionsRepo.save(question);

    const job = this.jobsRepo.create({
      id: uuidv4(),
      questionId,
      userId,
      jobType: AnalysisJobType.Analyze,
      status: AnalysisJobStatus.Queued,
      attempts: 0,
    });
    await this.jobsRepo.save(job);
    await this.queue.enqueue({
      jobId: job.id,
      questionId,
      userId,
      jobType: AnalysisJobType.Analyze,
    });
    return { jobId: job.id, queueMode: this.queue.getMode() };
  }

  async enqueueOcr(params: {
    questionId: string;
    userId: string;
    imagePath: string;
  }) {
    const job = this.jobsRepo.create({
      id: uuidv4(),
      questionId: params.questionId,
      userId: params.userId,
      jobType: AnalysisJobType.Ocr,
      status: AnalysisJobStatus.Queued,
      attempts: 0,
    });
    await this.jobsRepo.save(job);
    await this.queue.enqueue({
      jobId: job.id,
      questionId: params.questionId,
      userId: params.userId,
      jobType: AnalysisJobType.Ocr,
      imagePath: params.imagePath,
    });
    return { jobId: job.id, queueMode: this.queue.getMode() };
  }

  async getJob(id: string, userId: string) {
    const job = await this.jobsRepo.findOne({ where: { id, userId } });
    if (!job) {
      throw new NotFoundException('找不到工作');
    }
    return job;
  }
}
