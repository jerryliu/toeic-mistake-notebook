import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ErrorType } from '../../common/enums';

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  stem?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(7)
  part?: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  correctOption?: string;

  @ApiPropertyOptional({ example: 'B' })
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  userOption?: string;

  @ApiPropertyOptional({ enum: ErrorType })
  @IsOptional()
  @IsIn(Object.values(ErrorType))
  errorType?: ErrorType;

  @ApiPropertyOptional({ description: '正解解釋（寫入 analysis）' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  correctExplanation?: string;

  @ApiPropertyOptional({ description: '題型標籤' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  questionType?: string;
}
