import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { QuestionStatus } from '../common/enums';
import {
  Question,
  QuestionAnalysis,
  QuestionOption,
} from '../entities';
import { JobsService } from '../jobs/jobs.service';
import { ConfirmQuestionDto } from './dto/confirm-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepo: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionsRepo: Repository<QuestionOption>,
    @InjectRepository(QuestionAnalysis)
    private readonly analysesRepo: Repository<QuestionAnalysis>,
    private readonly jobsService: JobsService,
  ) {}

  async createFromPaste(userId: string, dto: CreateQuestionDto) {
    const labels = dto.options.map((o) => o.label);
    if (new Set(labels).size !== labels.length) {
      throw new BadRequestException('選項標籤不可重複');
    }
    if (!labels.includes(dto.correctOption) || !labels.includes(dto.userOption)) {
      throw new BadRequestException('答案必須對應既有選項');
    }

    const question = this.questionsRepo.create({
      id: uuidv4(),
      userId,
      stem: dto.stem,
      part: dto.part ?? 5,
      correctOption: dto.correctOption,
      userOption: dto.userOption,
      sourceText: dto.sourceText ?? dto.stem,
      status: QuestionStatus.Draft,
      repetitionCount: 0,
      intervalDays: 0,
    });
    await this.questionsRepo.save(question);

    const options = dto.options.map((opt, idx) =>
      this.optionsRepo.create({
        id: uuidv4(),
        questionId: question.id,
        label: opt.label,
        content: opt.content,
        sortOrder: idx,
      }),
    );
    await this.optionsRepo.save(options);
    return this.getDetail(question.id, userId);
  }

  async createFromOcrUpload(params: {
    userId: string;
    imageUrl: string;
    imagePath: string;
  }) {
    const question = this.questionsRepo.create({
      id: uuidv4(),
      userId: params.userId,
      part: 5,
      imageUrl: params.imageUrl,
      status: QuestionStatus.Draft,
      stem: null,
      sourceText: null,
      repetitionCount: 0,
      intervalDays: 0,
    });
    await this.questionsRepo.save(question);

    const { jobId, queueMode } = await this.jobsService.enqueueOcr({
      questionId: question.id,
      userId: params.userId,
      imagePath: params.imagePath,
    });

    return {
      question: await this.getDetail(question.id, params.userId),
      jobId,
      queueMode,
    };
  }

  async list(userId: string) {
    const items = await this.questionsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return { items };
  }

  async getDetail(id: string, userId: string) {
    const question = await this.questionsRepo.findOne({ where: { id, userId } });
    if (!question) {
      throw new NotFoundException('找不到題目');
    }
    const options = await this.optionsRepo.find({
      where: { questionId: id },
      order: { sortOrder: 'ASC' },
    });
    const analysis = await this.analysesRepo.findOne({
      where: { questionId: id },
    });
    return { question, options, analysis };
  }

  async update(id: string, userId: string, dto: UpdateQuestionDto) {
    const detail = await this.getDetail(id, userId);
    const q = detail.question;

    if (dto.stem !== undefined) q.stem = dto.stem;
    if (dto.part !== undefined) q.part = dto.part;
    if (dto.correctOption !== undefined) q.correctOption = dto.correctOption;
    if (dto.userOption !== undefined) q.userOption = dto.userOption;
    if (dto.errorType !== undefined) q.errorType = dto.errorType;
    await this.questionsRepo.save(q);

    if (
      dto.correctExplanation !== undefined ||
      dto.questionType !== undefined ||
      dto.errorType !== undefined
    ) {
      let analysis = detail.analysis;
      if (!analysis) {
        analysis = this.analysesRepo.create({
          id: uuidv4(),
          questionId: id,
        });
      }
      if (dto.correctExplanation !== undefined) {
        analysis.correctExplanation = dto.correctExplanation;
      }
      if (dto.questionType !== undefined) {
        analysis.questionType = dto.questionType;
      }
      if (dto.errorType !== undefined) {
        analysis.errorType = dto.errorType;
      }
      await this.analysesRepo.save(analysis);
    }

    return this.getDetail(id, userId);
  }

  async analyze(id: string, userId: string) {
    await this.getDetail(id, userId);
    const { jobId, queueMode } = await this.jobsService.enqueueAnalyze(
      id,
      userId,
    );
    return { jobId, queueMode, questionId: id };
  }

  async confirm(id: string, userId: string, dto: ConfirmQuestionDto) {
    if (dto.part || dto.correctOption || dto.userOption || dto.errorType || dto.correctExplanation) {
      await this.update(id, userId, dto);
    }

    const detail = await this.getDetail(id, userId);
    const q = detail.question;

    if (!q.stem) {
      throw new BadRequestException('請先填寫題幹');
    }
    if (!q.correctOption || !q.userOption) {
      throw new BadRequestException('請標記正解與你的答案');
    }
    if (!detail.options.length) {
      throw new BadRequestException('請至少有兩個選項');
    }

    const now = new Date();
    q.status = QuestionStatus.Ready;
    q.intervalDays = 0;
    q.repetitionCount = 0;
    q.nextReviewAt = now;
    if (dto.errorType) {
      q.errorType = dto.errorType;
    } else if (!q.errorType && detail.analysis?.errorType) {
      q.errorType = detail.analysis.errorType;
    }
    await this.questionsRepo.save(q);

    if (detail.analysis) {
      detail.analysis.confirmedAt = now;
      if (dto.errorType) detail.analysis.errorType = dto.errorType;
      if (dto.correctExplanation) {
        detail.analysis.correctExplanation = dto.correctExplanation;
      }
      await this.analysesRepo.save(detail.analysis);
    }

    return this.getDetail(id, userId);
  }

  async waitForJob(
    jobId: string,
    userId: string,
    timeoutMs = 8000,
  ): Promise<{ status: string }> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const job = await this.jobsService.getJob(jobId, userId);
      if (
        job.status === 'succeeded' ||
        job.status === 'failed'
      ) {
        return { status: job.status };
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    return { status: 'timeout' };
  }
}
