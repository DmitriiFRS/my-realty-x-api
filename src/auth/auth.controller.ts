import { Controller, HttpCode, HttpStatus, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { VerifySmsCodeDto } from './dto/verify-sms-code.dto';
import { RequestCodeDto } from './dto/request-code.dto';

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
  async logout(@GetUser('id') userId: number) {
    return this.authService.logout(userId);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@GetUser('sub') userId: number, @GetUser('refreshToken') refreshToken: string) {
    return await this.authService.refreshTokens(userId, refreshToken);
  }
}
