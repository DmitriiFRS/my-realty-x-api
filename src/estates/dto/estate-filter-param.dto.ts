import { IsIn, IsOptional } from 'class-validator';

export class EstatesFilterParamDto {
  @IsOptional()
  @IsIn(['archived', 'exclusive', 'all'], {
    message: 'filter must be one of: archived, exclusive, all',
  })
  filter?: 'archived' | 'exclusive' | 'all';
}
