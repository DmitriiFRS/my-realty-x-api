import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindOrCreateTgDto } from './dto/findOrCreateTg.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser('id') userId: number) {
    return this.usersService.getMe(userId);
  }

  @Post('auth')
  @UsePipes(new ValidationPipe())
  async authByTelegram(@Body() dto: FindOrCreateTgDto) {
    return this.usersService.findOrCreateByTelegramId(dto);
  }
}
