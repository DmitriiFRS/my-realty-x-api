import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class RequestCodeDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsPhoneNumber('UZ', { message: 'Неверный формат номера телефона' })
  phone: string;
}
