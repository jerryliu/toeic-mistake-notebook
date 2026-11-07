import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnalysisJobStatus, AnalysisJobType } from '../common/enums';

@Entity('analysis_jobs')
export class AnalysisJob {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'question_id', type: 'varchar', length: 36 })
  questionId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ name: 'job_type', type: 'varchar', length: 32 })
  jobType!: AnalysisJobType;

  @Column({
    type: 'varchar',
    length: 32,
    default: AnalysisJobStatus.Queued,
  })
  status!: AnalysisJobStatus;

  @Column({ type: 'int', unsigned: true, default: 0 })
  attempts!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'result_json', type: 'json', nullable: true })
  resultJson!: Record<string, unknown> | null;

  @Column({ name: 'started_at', type: 'datetime', precision: 3, nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'datetime', precision: 3, nullable: true })
  finishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date;
}
