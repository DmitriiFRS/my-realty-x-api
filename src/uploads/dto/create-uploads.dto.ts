import { IsInt, IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityType } from '../enums/entity-type.enum';

export class CreateUploadsDto {
  @IsInt()
  @Type(() => Number)
  entityId: number;

  @IsEnum(EntityType)
  entityType: EntityType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  captions?: string[];
}
