import { IsString, MinLength } from 'class-validator';

export class AdminAuthDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
