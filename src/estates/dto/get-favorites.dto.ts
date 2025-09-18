import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';

export class GetFavoritesDto {
  @IsArray()
  @IsInt({ each: true }) // Проверяем, что каждый элемент — целое число
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((id) => parseInt(id, 10));
    }
    return value;
  })
  ids: number[];
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Преобразуем строку в число
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Преобразуем строку в число
  limit?: number = 10;
}
