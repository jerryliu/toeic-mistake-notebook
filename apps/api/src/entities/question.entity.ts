import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionStatus } from '../common/enums';

@Entity('questions')
export class Question {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  part!: number | null;

  @Column({ type: 'text', nullable: true })
  stem!: string | null;

  @Column({ name: 'correct_option', type: 'varchar', length: 1, nullable: true })
  correctOption!: string | null;

  @Column({ name: 'user_option', type: 'varchar', length: 1, nullable: true })
  userOption!: string | null;

  @Column({ name: 'error_type', type: 'varchar', length: 32, nullable: true })
  errorType!: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: QuestionStatus.Draft,
  })
  status!: QuestionStatus;

  @Column({ name: 'source_text', type: 'text', nullable: true })
  sourceText!: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 512, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'next_review_at', type: 'datetime', precision: 3, nullable: true })
  nextReviewAt!: Date | null;

  @Column({ name: 'repetition_count', type: 'int', unsigned: true, default: 0 })
  repetitionCount!: number;

  @Column({ name: 'interval_days', type: 'int', unsigned: true, default: 0 })
  intervalDays!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date;
}
