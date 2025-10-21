import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/types/user.type';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma.service';
import { SmsVerificationType } from '@prisma/client';
import { nanoid } from 'nanoid';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { hashPassword } from 'src/utils/bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
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

    const data = await this.generateAndSendCode(phone, SmsVerificationType.LOGIN);

    return {
      message: 'Код для входа отправлен.',
      code: data.code,
    };
  }

  async verifySmsCodeAndLogin(dto: VerifySmsCodeDto) {
    const { phone, code, type, initData } = dto;

    const verification = await this.prisma.smsVerification.findUnique({
      where: { phone_type: { phone, type } },
    });

    if (verification) {
      await this.prisma.smsVerification.delete({ where: { id: verification.id } });
    }

    if (!verification || verification.code !== code || new Date() > verification.expiresAt) {
      throw new BadRequestException('Неверный код или срок его действия истёк.');
    }

    if (initData) {
      const userDataFromTelegram = this.validateTelegramInitData(initData);
      const telegramUser = JSON.parse(userDataFromTelegram.user);
      const telegramId = telegramUser.id.toString();
      const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username;
      const slug = `u-${nanoid(10)}`;

      const user = await this.prisma.user.upsert({
        where: { phone },
        update: { telegramId },
        create: { phone, name, slug, telegramId },
      });
      return this.login(user as IUser);
    }
    let user = await this.usersService.findOne(phone);
    if (type === SmsVerificationType.REGISTRATION && !user) {
      const baseName = `user_${phone.slice(-4)}${Date.now().toString().slice(-4)}`;
      const slug = `u-${nanoid(10)}`;
      user = await this.prisma.user.create({ data: { phone, name: baseName, slug } });
    }
    console.log('user after verification:', user);

    if (!user) throw new UnauthorizedException('Не удалось найти или создать пользователя.');
    console.log('User verified and ready to log in:', { id: user.id, phone: user.phone });
    return this.login(user as IUser);
  }

  async adminRegister(dto: AdminRegisterDto) {
    const { phone, password, name, roleId = 1 } = dto;
    if (![1, 2].includes(roleId)) {
      throw new BadRequestException('roleId must be 1 or 2');
    }
    const existsByPhone = await this.prisma.user.findUnique({ where: { phone } });
    if (existsByPhone) {
      throw new ConflictException('Номер телефона уже используется');
    }
    const existsByName = await this.prisma.user.findUnique({ where: { name } });
    if (existsByName) {
      throw new ConflictException('Display name уже используется');
    }
    const slug = `u-${nanoid(10)}`;
    const hashedPassword = await hashPassword(password);
    const created = await this.prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        name,
        roleId,
        slug,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        slug: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return { success: true, user: created };
  }

  async adminLogin(phone: string, password: string) {
    console.log('Admin login attempt for phone:', phone);
    if (!phone || !password) throw new BadRequestException('phone and password are required');
    const user = await this.usersService.findOne(phone);
    if (!user) throw new UnauthorizedException('Неверные учётные данные');
    if (![1, 2].includes(user.roleId)) {
      throw new ForbiddenException('Доступ запрещён: пользователь не администратор');
    }
    if (!user.password) {
      throw new BadRequestException('Пароль не установлен для этого пользователя');
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверные учётные данные');
    }

    const payload = { sub: user.id, phone: user.phone };
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.configService.get<string | number>('JWT_ACCESS_EXPIRATION') ?? '2h';
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
    return { accessToken };
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
    // if (!refreshToken) {
    //   throw new ForbiddenException('Доступ запрещен.');
    // }
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

  private async generateAndSendCode(phone: string, type: SmsVerificationType): Promise<{ code: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 минуты

    await this.prisma.smsVerification.upsert({
      where: { phone_type: { phone, type } },
      update: { code, expiresAt },
      create: { phone, code, expiresAt, type },
    });
    // await this.smsService.sendVerificationCode(phone, code);
    console.log(`[SMS Service Mock] Code for ${phone} (${type}): ${code}`);
    return { code };
  }

  async loginWithTelegram(dto: TelegramLoginDto) {
    const userDataFromTelegram = this.validateTelegramInitData(dto.initData);
    const telegramUser = JSON.parse(userDataFromTelegram.user);
    const telegramId = telegramUser.id.toString();
    const userByTg = await this.prisma.user.findUnique({ where: { telegramId } });
    if (userByTg) {
      if (userByTg.phone !== dto.phone) {
        console.log('userByTg.phone !== dto.phone', userByTg.phone, dto.phone);
        throw new BadRequestException('Введенный номер телефона не совпадает с номером, который привязан к этому Telegram-аккаунту.');
      }
      return this.login(userByTg as IUser);
      // error userByTg.phone !== dto.phone
    }
    const userByPhone = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (userByPhone && userByPhone.telegramId) {
      throw new ConflictException('Номер телефона уже используется другим Telegram-аккаунтом.');
    }
    const codeData = await this.generateAndSendCode(dto.phone, SmsVerificationType.LOGIN);
    return {
      message: 'Требуется верификация по СМС.',
      code: 'PHONE_NEEDS_VERIFICATION',
      verificationCode: codeData.code,
    };
  }

  private validateTelegramInitData(initData: string): Record<string, string> {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (hmac !== hash) {
      throw new UnauthorizedException('Invalid hash. Data is not from Telegram.');
    }
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 3600) {
      throw new UnauthorizedException('Data is outdated.');
    }
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
