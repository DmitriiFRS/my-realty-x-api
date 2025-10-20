import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ReactionType } from '@prisma/client';

export class ReactDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(ReactionType)
  type: ReactionType;
}
