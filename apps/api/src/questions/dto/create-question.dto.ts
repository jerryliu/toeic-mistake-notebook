import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuestionOptionDto {
  @ApiProperty({ example: 'A' })
  @IsIn(['A', 'B', 'C', 'D'])
  label!: string;

  @ApiProperty({ example: 'be' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class CreateQuestionDto {
  @ApiProperty({
    example:
      'The committee has decided that the proposal ------ reviewed carefully.',
  })
  @IsString()
  @MinLength(1)
  stem!: string;

  @ApiProperty({ type: [QuestionOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];

  @ApiProperty({ example: 'A' })
  @IsIn(['A', 'B', 'C', 'D'])
  correctOption!: string;

  @ApiProperty({ example: 'B' })
  @IsIn(['A', 'B', 'C', 'D'])
  userOption!: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(7)
  part?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceText?: string;
}
