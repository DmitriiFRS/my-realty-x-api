import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class TelegramLoginDto {
  @IsString()
  @IsNotEmpty()
  initData: string;

  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsPhoneNumber(undefined, { message: 'Неверный формат номера телефона' })
  phone: string;
}
