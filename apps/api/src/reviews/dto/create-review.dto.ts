import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReviewConfidence } from '../../common/enums';

export class CreateReviewDto {
  @ApiProperty({ example: 'B', description: '本次回憶選擇的選項' })
  @IsIn(['A', 'B', 'C', 'D'])
  recalledOption!: string;

  @ApiProperty({
    enum: ReviewConfidence,
    example: ReviewConfidence.WrongFamiliar,
    description: '不會 / 答錯 / 答對但不確定 / 答對且很熟',
  })
  @IsIn(Object.values(ReviewConfidence))
  confidence!: ReviewConfidence;

  @ApiPropertyOptional({ description: '作答理由（可跳過）' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reasonNote?: string;
}
