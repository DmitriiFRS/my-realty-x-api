import { Recurrence } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateReminderDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive number with up to 2 decimals (e.g. 1000.00)',
  })
  amount: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  originalDay?: number;

  @IsNotEmpty()
  @IsIn([1, 3, 7])
  @Type(() => Number)
  advanceDays: number;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(Recurrence)
  recurrence?: Recurrence = Recurrence.MONTHLY;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean = true;
}
