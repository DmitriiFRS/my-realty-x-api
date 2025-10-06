import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateReminderDto {
  @IsString({ message: 'Текст должен быть строкой' })
  @IsNotEmpty({ message: 'Текст не может быть пустым' })
  text: string;

  @IsDateString({}, { message: 'Время должно быть в формате ISO' })
  @IsNotEmpty({ message: 'Время не может быть пустым' })
  remindAt: string;
}
