import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';
import { ReviewConfidence } from '../common/enums';

@Entity('reviews')
export class Review {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'question_id', type: 'varchar', length: 36 })
  questionId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ name: 'recalled_option', type: 'varchar', length: 1, nullable: true })
  recalledOption!: string | null;

  @Column({ name: 'is_correct', type: 'tinyint', width: 1, nullable: true })
  isCorrect!: boolean | null;

  @Column({ type: 'varchar', length: 32 })
  confidence!: ReviewConfidence;

  @Column({ name: 'reason_note', type: 'text', nullable: true })
  reasonNote!: string | null;

  @Column({ name: 'interval_days', type: 'int', unsigned: true, default: 0 })
  intervalDays!: number;

  @Column({ name: 'next_review_at', type: 'datetime', precision: 3 })
  nextReviewAt!: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', precision: 3 })
  reviewedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;
}
