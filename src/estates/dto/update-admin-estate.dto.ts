import { EstateStatusEnum } from '@prisma/client';
import { IsOptional, IsArray, IsInt, IsString, IsEnum } from 'class-validator';
import { CreateAdminEstateDto } from './create-admin-estate.dto';
import { Transform } from 'class-transformer';

export class UpdateAdminEstateDto extends CreateAdminEstateDto {
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
