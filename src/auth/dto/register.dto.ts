import { IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber(undefined, { message: 'Укажите правильный номер телефона в международном формате (например, +998901234567)' })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
