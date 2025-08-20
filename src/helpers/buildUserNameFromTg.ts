import { FindOrCreateTgDto } from 'src/users/dto/findOrCreateTg.dto';

export function buildUserNameFromTg(dto: FindOrCreateTgDto): string {
  // Если явно передали name — берём его
  if (dto.name && dto.name.trim().length > 0) {
    return dto.name.trim();
  }

  // Если есть username (ник) — возьмём его
  if (dto.username && dto.username.trim().length > 0) {
    return dto.username.trim();
  }

  // Соберём first + last
  const parts: string[] = [];
  if (dto.firstName && dto.firstName.trim().length > 0)
    parts.push(dto.firstName.trim());
  if (dto.lastName && dto.lastName.trim().length > 0)
    parts.push(dto.lastName.trim());
  if (parts.length > 0) return parts.join(' ');

  // В крайнем случае — fallback на tg_<id>
  return `tg_${dto.telegramId}`;
}
