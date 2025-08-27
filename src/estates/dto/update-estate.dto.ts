import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { CreateEstateDto } from './create-estate.dto';
import { Type } from 'class-transformer';
import { EstateStatusEnum } from '@prisma/client';

export class UpdateEstateDto extends CreateEstateDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  existingImageIds?: number[];

  @IsString()
  @IsEnum(EstateStatusEnum)
  @IsOptional()
  status?: EstateStatusEnum;
}
