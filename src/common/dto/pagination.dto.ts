import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 4;
}
