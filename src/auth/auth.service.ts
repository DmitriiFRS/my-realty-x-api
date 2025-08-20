import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Валидация initData от Telegram
  validateTelegramInitData(initData: string) {
    // initData — строка вида "id=...&first_name=...&auth_date=...&hash=..."
    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash') ?? '';
    // Собираем пары key=value, кроме hash
    const pairs: string[] = [];
    for (const [k, v] of params.entries()) {
      if (k === 'hash') continue;
      pairs.push(`${k}=${v}`);
    }
    pairs.sort(); // алфавитный порядок
    const dataCheckString = pairs.join('\n');

    // secret = SHA256(bot_token)
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    // HMAC-SHA256(data_check_string, secretKey)
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Защищённое сравнение
    const hmacBuf = Buffer.from(hmac, 'hex');
    const recvBuf = Buffer.from(receivedHash, 'hex');
    if (
      hmacBuf.length !== recvBuf.length ||
      !crypto.timingSafeEqual(hmacBuf, recvBuf)
    ) {
      throw new UnauthorizedException(
        'Invalid Telegram initData (hash mismatch)',
      );
    }

    // Проверка свежести (настраиваемо)
    const authDate = Number(params.get('auth_date') ?? '0');
    const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
    if (ageSeconds > 60 * 60 * 24) {
      // например, 24 часа
      throw new UnauthorizedException('initData expired');
    }

    // Вернём разобранный объект (без hash)
    const result: Record<string, string> = {};
    for (const [k, v] of params.entries()) {
      if (k === 'hash') continue;
      result[k] = v;
    }
    return result;
  }

  async loginWithTelegram(initData: string) {
    const payload = this.validateTelegramInitData(initData); // throws если невалидно

    // payload.id — Telegram user id (string), payload.username, payload.first_name, photo_url...
    const telegramId = payload.id;
    // findOrCreate пользователя через UsersService (Prisma)
    const user = await this.usersService.findOrCreateByTelegramId({
      telegramId,
      username: payload.username,
      firstName: payload.first_name,
      lastName: payload.last_name,
      photoUrl: payload.photo_url,
      phone: payload.phone_number,
    });

    // Подпись JWT — можно положить sub: user.id и telegramId
    const token = this.jwtService.sign({ sub: user.id, tid: telegramId });

    return { access_token: token, user };
  }
}
