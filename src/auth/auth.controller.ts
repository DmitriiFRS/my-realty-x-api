import { Controller, HttpCode, HttpStatus, Post, UseGuards, Body, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { TelegramLoginDto } from './dto/telegram-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-registration-code')
  @HttpCode(HttpStatus.OK)
  async requestRegistrationCode(@Body() dto: RequestCodeDto) {
    return this.authService.requestRegistrationCode(dto.phone);
  }

  @Post('request-login-code')
  @HttpCode(HttpStatus.OK)
  async requestLoginCode(@Body() dto: RequestCodeDto) {
    return this.authService.requestLoginCode(dto.phone);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() dto: VerifySmsCodeDto) {
    return this.authService.verifySmsCodeAndLogin(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@GetUser('sub') userId: number) {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @GetUser() userFromToken: any, // Временно получаем весь объект user
    @Body('refreshToken') refreshToken: string,
  ) {
    const userId = userFromToken?.sub; // Вручную извлекаем ID (поле sub)

    if (!userId) {
      // Если ID не найден, выбрасываем ошибку
      throw new ForbiddenException('Could not identify user from token payload.');
    }

    return await this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  async loginWithTelegram(@Body() dto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(dto);
  }
}
