import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('question_options')
export class QuestionOption {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'question_id', type: 'varchar', length: 36 })
  questionId!: string;

  @Column({ type: 'varchar', length: 1 })
  label!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;
}
