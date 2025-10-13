import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindOrCreateTgDto } from './dto/findOrCreateTg.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateReminderDto } from './dto/updateReminder.dto';

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

  @Get('crm/reminders')
  @UseGuards(JwtAuthGuard)
  async getEstatesWithReminders(@GetUser('id') userId: number) {
    return this.usersService.getReminders(userId);
  }

  @Delete('crm/reminders/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReminder(@GetUser('id') userId: number, @Param('id') reminderId: number) {
    return this.usersService.deleteReminder(userId, reminderId);
  }

  @Patch('crm/reminders/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  async updateReminder(@GetUser('id') userId: number, @Param('id', ParseIntPipe) reminderId: number, @Body() dto: UpdateReminderDto) {
    return this.usersService.updateReminder(userId, reminderId, dto);
  }
}
