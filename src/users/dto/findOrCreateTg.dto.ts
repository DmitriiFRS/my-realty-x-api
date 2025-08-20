import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FindOrCreateTgDto {
  @IsString()
  @IsNotEmpty()
  telegramId: string;

  @IsOptional()
  @IsString()
  name?: string | null;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  username?: string | null;

  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;
}
