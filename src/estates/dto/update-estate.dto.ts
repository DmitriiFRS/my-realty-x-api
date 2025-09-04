import { IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { CreateEstateDto } from './create-estate.dto';
import { Transform } from 'class-transformer';
import { EstateStatusEnum } from '@prisma/client';

export class UpdateEstateDto extends CreateEstateDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return undefined;
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
  existingImageIds?: number[];

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  @IsEnum(EstateStatusEnum)
  @IsOptional()
  status?: EstateStatusEnum;
}
