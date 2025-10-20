import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { CreateEstateDto } from './create-estate.dto';

export class CreateAdminEstateDto extends CreateEstateDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetUserId: number;
}
