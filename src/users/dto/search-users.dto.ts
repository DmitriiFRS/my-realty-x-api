import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  searchText?: string;
}
