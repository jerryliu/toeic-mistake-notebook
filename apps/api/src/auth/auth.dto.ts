import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@toeic.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  @MinLength(4)
  password!: string;
}
