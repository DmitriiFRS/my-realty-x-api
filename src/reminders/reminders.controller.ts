import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateReminderDto } from 'src/users/dto/createReminder.dto';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('my-reminders')
  @UseGuards(JwtAuthGuard)
  async getRemindersByUserId(@GetUser('id') userId: number) {
    return await this.remindersService.getRemindersByUserId(userId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createReminder(@GetUser('id') userId: number, @Body() dto: CreateReminderDto) {
    return this.remindersService.createReminder(userId, dto);
  }
}
