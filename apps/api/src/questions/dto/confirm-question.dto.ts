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
} from 'class-validator';
import { ErrorType } from '../../common/enums';

/** Optional last-mile edits applied before confirming into review. */
export class ConfirmQuestionDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(7)
  part?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  correctOption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  userOption?: string;

  @ApiPropertyOptional({ enum: ErrorType })
  @IsOptional()
  @IsIn(Object.values(ErrorType))
  errorType?: ErrorType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  correctExplanation?: string;
}
