import { IsString, MinLength, IsIn } from 'class-validator';

export class AdminRegisterDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsIn([1, 2])
  roleId: number;
}
