import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('question_analyses')
export class QuestionAnalysis {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'question_id', type: 'varchar', length: 36, unique: true })
  questionId!: string;

  @Column({ name: 'question_type', type: 'varchar', length: 64, nullable: true })
  questionType!: string | null;

  @Column({ name: 'correct_explanation', type: 'text', nullable: true })
  correctExplanation!: string | null;

  @Column({ name: 'distractor_explanations', type: 'json', nullable: true })
  distractorExplanations!: Record<string, string> | null;

  @Column({ name: 'error_type', type: 'varchar', length: 32, nullable: true })
  errorType!: string | null;

  @Column({ name: 'vocab_tags', type: 'json', nullable: true })
  vocabTags!: string[] | null;

  @Column({ name: 'grammar_tags', type: 'json', nullable: true })
  grammarTags!: string[] | null;

  @Column({ name: 'similar_examples', type: 'json', nullable: true })
  similarExamples!: string[] | null;

  @Column({ name: 'raw_json', type: 'json', nullable: true })
  rawJson!: Record<string, unknown> | null;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidence!: string | null;

  @Column({ name: 'confirmed_at', type: 'datetime', precision: 3, nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date;
}
