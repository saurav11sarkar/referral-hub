import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectTaskSubmissionDto {
  @ApiPropertyOptional({ example: 'স্ক্রিনশটে কাজের প্রমাণ স্পষ্ট নয়।' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
