import { Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateReminderDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  estateId: number;

  @IsOptional()
  @IsString()
  text?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  originalDay?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsIn([1, 3, 7])
  @Type(() => Number)
  advanceDays?: number;

  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence = Recurrence.MONTHLY;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;
}
