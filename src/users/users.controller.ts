import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FindOrCreateTgDto } from './dto/findOrCreateTg.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('auth')
  @UsePipes(new ValidationPipe())
  async authByTelegram(@Body() dto: FindOrCreateTgDto) {
    return this.usersService.findOrCreateByTelegramId(dto);
  }
}
