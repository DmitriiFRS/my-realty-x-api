import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/types/user.type';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';
import { SmsVerificationType } from '@prisma/client';
import { SmsService } from 'src/sms/sms.service';
import { nanoid } from 'nanoid';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private readonly configService: ConfigService,
  ) {}

  async requestRegistrationCode(phone: string) {
    const existingUser = await this.usersService.findOne(phone);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким номером телефона уже существует.');
    }

    await this.generateAndSendCode(phone, SmsVerificationType.REGISTRATION);

    return {
      message: 'Код для регистрации отправлен.',
    };
  }

  async requestLoginCode(phone: string) {
    const existingUser = await this.usersService.findOne(phone);
    if (!existingUser) {
      throw new BadRequestException('Пользователь с таким номером не найден.');
    }

    await this.generateAndSendCode(phone, SmsVerificationType.LOGIN);

    return {
      message: 'Код для входа отправлен.',
    };
  }

  async verifySmsCodeAndLogin(dto: VerifySmsCodeDto) {
    const { phone, code, type } = dto;

    const verification = await this.prisma.smsVerification.findUnique({
      where: { phone_type: { phone, type } },
    });

    if (verification) {
      await this.prisma.smsVerification.delete({ where: { id: verification.id } });
    }

    if (!verification || verification.code !== code || new Date() > verification.expiresAt) {
      throw new BadRequestException('Неверный код или срок его действия истёк.');
    }

    let user = await this.usersService.findOne(phone);

    if (type === SmsVerificationType.REGISTRATION && !user) {
      const baseName = `user_${phone.slice(-4)}${Date.now().toString().slice(-4)}`;
      const slug = `u-${nanoid(10)}`;
      user = await this.prisma.user.create({
        data: { phone, name: baseName, slug },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Не удалось найти или создать пользователя.');
    }

    return this.login(user as IUser);
  }

  async login(user: IUser) {
    const tokens = await this.getTokens(user.id, user.phone);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: null,
      },
    });
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedToken = await bcrypt.hash(refreshToken, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hashedToken },
    });
  }

  private async getTokens(userId: number, phone: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          phone,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          phone,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Доступ запрещен.');
    }
    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!refreshTokenMatches) {
      throw new ForbiddenException('Доступ запрещен.');
    }
    const tokens = await this.getTokens(user.id, user.phone);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private async generateAndSendCode(phone: string, type: SmsVerificationType) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

    await this.prisma.smsVerification.upsert({
      where: { phone_type: { phone, type } },
      update: { code, expiresAt },
      create: { phone, code, expiresAt, type },
    });
    // await this.smsService.sendVerificationCode(phone, code);
    console.log(`[SMS Service Mock] Code for ${phone} (${type}): ${code}`);
  }

  // // Валидация initData от Telegram
  // validateTelegramInitData(initData: string) {
  //   // initData — строка вида "id=...&first_name=...&auth_date=...&hash=..."
  //   const params = new URLSearchParams(initData);
  //   const receivedHash = params.get('hash') ?? '';
  //   // Собираем пары key=value, кроме hash
  //   const pairs: string[] = [];
  //   for (const [k, v] of params.entries()) {
  //     if (k === 'hash') continue;
  //     pairs.push(`${k}=${v}`);
  //   }
  //   pairs.sort(); // алфавитный порядок
  //   const dataCheckString = pairs.join('\n');

  //   // secret = SHA256(bot_token)
  //   const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN') || '';
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //   const secretKey = crypto.createHash('sha256').update(botToken).digest();
  //   // HMAC-SHA256(data_check_string, secretKey)
  //   const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  //   // Защищённое сравнение
  //   const hmacBuf = Buffer.from(hmac, 'hex');
  //   const recvBuf = Buffer.from(receivedHash, 'hex');
  //   if (hmacBuf.length !== recvBuf.length || !crypto.timingSafeEqual(hmacBuf, recvBuf)) {
  //     throw new UnauthorizedException('Invalid Telegram initData (hash mismatch)');
  //   }

  //   // Проверка свежести (настраиваемо)
  //   const authDate = Number(params.get('auth_date') ?? '0');
  //   const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  //   if (ageSeconds > 60 * 60 * 24) {
  //     // например, 24 часа
  //     throw new UnauthorizedException('initData expired');
  //   }

  //   // Вернём разобранный объект (без hash)
  //   const result: Record<string, string> = {};
  //   for (const [k, v] of params.entries()) {
  //     if (k === 'hash') continue;
  //     result[k] = v;
  //   }
  //   return result;
  // }

  // async loginWithTelegram(initData: string) {
  //   const payload = this.validateTelegramInitData(initData); // throws если невалидно

  //   // payload.id — Telegram user id (string), payload.username, payload.first_name, photo_url...
  //   const telegramId = payload.id;
  //   // findOrCreate пользователя через UsersService (Prisma)
  //   const user = await this.usersService.findOrCreateByTelegramId({
  //     telegramId,
  //     username: payload.username,
  //     firstName: payload.first_name,
  //     lastName: payload.last_name,
  //     photoUrl: payload.photo_url,
  //     phone: payload.phone_number,
  //   });

  //   // Подпись JWT — можно положить sub: user.id и telegramId
  //   const token = this.jwtService.sign({ sub: user.id, tid: telegramId });

  //   return { access_token: token, user };
  // }
}
