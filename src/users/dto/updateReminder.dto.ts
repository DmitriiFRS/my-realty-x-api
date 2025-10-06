import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @IsOptional()
  @IsDateString()
  remindAt?: string;
}
