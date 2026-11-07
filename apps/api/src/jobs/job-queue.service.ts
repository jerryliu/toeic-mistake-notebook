import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

export type AnalysisJobPayload = {
  jobId: string;
  questionId: string;
  userId: string;
  jobType: 'ocr' | 'analyze';
  imagePath?: string;
};

export type JobHandler = (payload: AnalysisJobPayload) => Promise<void>;

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private mode: 'bullmq' | 'inline' = 'inline';
  private connection: IORedis | null = null;
  private queue: Queue<AnalysisJobPayload> | null = null;
  private worker: Worker<AnalysisJobPayload> | null = null;
  private handler: JobHandler | null = null;

  constructor(private readonly config: ConfigService) {}

  setHandler(handler: JobHandler) {
    this.handler = handler;
  }

  async onModuleInit() {
    const skipDb = this.config.get('SKIP_DB') === '1';
    const forceInline = this.config.get('QUEUE_INLINE') === '1';
    const redisUrl =
      this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    if (skipDb || forceInline) {
      this.mode = 'inline';
      this.logger.log('Job queue mode: inline (SKIP_DB/QUEUE_INLINE)');
      return;
    }

    try {
      this.connection = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 1500,
      });
      await this.connection.connect();
      await this.connection.ping();

      this.queue = new Queue<AnalysisJobPayload>('toeic-analysis', {
        connection: this.connection.duplicate(),
      });
      this.worker = new Worker<AnalysisJobPayload>(
        'toeic-analysis',
        async (job: Job<AnalysisJobPayload>) => {
          if (!this.handler) {
            throw new Error('Job handler not registered');
          }
          await this.handler(job.data);
        },
        { connection: this.connection.duplicate() },
      );
      this.worker.on('failed', (job, err) => {
        this.logger.error(
          `BullMQ job ${job?.id} failed: ${err.message}`,
          err.stack,
        );
      });
      this.mode = 'bullmq';
      this.logger.log('Job queue mode: bullmq');
    } catch (err) {
      this.logger.warn(
        `Redis unavailable (${(err as Error).message}); falling back to inline queue`,
      );
      await this.teardownRedis();
      this.mode = 'inline';
    }
  }

  async onModuleDestroy() {
    await this.teardownRedis();
  }

  getMode() {
    return this.mode;
  }

  async enqueue(payload: AnalysisJobPayload): Promise<void> {
    if (this.mode === 'bullmq' && this.queue) {
      await this.queue.add(payload.jobType, payload, {
        jobId: payload.jobId,
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 2,
      });
      return;
    }

    // In-process fallback — run soon after response is sent.
    setImmediate(() => {
      void this.runInline(payload);
    });
  }

  private async runInline(payload: AnalysisJobPayload) {
    if (!this.handler) {
      this.logger.error('Inline job dropped: handler missing');
      return;
    }
    try {
      await this.handler(payload);
    } catch (err) {
      this.logger.error(
        `Inline job ${payload.jobId} failed: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  private async teardownRedis() {
    try {
      await this.worker?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.queue?.close();
    } catch {
      /* ignore */
    }
    try {
      await this.connection?.quit();
    } catch {
      /* ignore */
    }
    this.worker = null;
    this.queue = null;
    this.connection = null;
  }
}
