import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsArray, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetFilteredEstatesDto extends PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  cityId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  districtId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  areaFrom?: number;

  @IsOptional()
  @IsInt()
  @Max(9999)
  @Type(() => Number)
  areaTo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  currencyTypeId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  dealTermId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  priceFrom?: number;

  @IsOptional()
  @IsInt()
  @Max(1000000000000)
  @Type(() => Number)
  priceTo?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' || typeof value === 'number') return [value];
    return [];
  })
  @IsArray({ message: 'rooms должен быть массивом' })
  @IsString({ each: true })
  features?: string[];
}
