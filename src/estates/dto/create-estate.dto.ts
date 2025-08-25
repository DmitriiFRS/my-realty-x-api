import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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
  currencyTypeId: number;
}
