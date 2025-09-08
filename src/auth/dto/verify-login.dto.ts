import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class VerifyLoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Номер телефона должен быть в международном формате',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code: string;
}
