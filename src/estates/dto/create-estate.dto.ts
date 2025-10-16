import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEstateDto {
  @IsString()
  description: string;

  @IsInt()
  @Type(() => Number)
  area: number;

  @IsInt()
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  estateTypeId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  dealTermId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  roomId?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  districtId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  cityId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  currencyTypeId: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value).map(Number);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value.map(Number) : [];
  })
  @IsArray()
  @IsInt({ each: true })
  features?: number[];

  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetUserId: number;
}
