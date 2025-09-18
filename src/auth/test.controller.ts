import { Controller, Get, HttpCode, HttpStatus, Query, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateInitData } from './helpers/generate-init-data.helper';

// Этот контроллер будет работать ТОЛЬКО в режиме разработки
@Controller('auth/test')
export class TestController {
  constructor(private readonly configService: ConfigService) {
    // ВАЖНО: Защита, чтобы этот контроллер никогда не попал в продакшн
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Test controller is not available in production');
    }
  }

  @Get('generate-init-data')
  @HttpCode(HttpStatus.OK)
  generateTestData(
    @Query('userId') userId: string = '12345678',
    @Query('firstName') firstName: string = 'Test',
    @Query('lastName') lastName: string = 'User',
    @Query('username') username: string = 'testuser',
  ) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      return { error: 'TELEGRAM_BOT_TOKEN is not configured in .env' };
    }

    // Собираем фейковый объект пользователя
    const mockUser = {
      id: parseInt(userId, 10),
      first_name: firstName,
      last_name: lastName,
      username: username,
      language_code: 'en',
      allows_write_to_pm: true,
    };

    const initData = generateInitData({ botToken, user: mockUser });

    return {
      message: 'Use this initData to test your /auth/telegram endpoint',
      initData,
      // Возвращаем также объект DTO для удобства
      mockDto: {
        initData,
        phone: '+998901234567', // Пример номера
      },
    };
  }
}
