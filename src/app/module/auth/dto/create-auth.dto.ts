import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({ example: 'Saurav Sarkar' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'saurav@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class LoginAuthDto {
  @ApiProperty({ example: 'saurav@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'saurav@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'saurav@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be a 6-digit string' })
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'saurav@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'newsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  oldPassword!: string;

  @ApiProperty({ example: 'newsecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}
