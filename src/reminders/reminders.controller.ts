import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  async updateReminder(@GetUser('id') userId: number, @Param('id') reminderId: number, @Body() dto: Partial<CreateReminderDto>) {
    return this.remindersService.updateReminder(userId, reminderId, dto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReminder(@GetUser('id') userId: number, @Param('id') reminderId: number) {
    return this.remindersService.deleteReminder(userId, reminderId);
  }
}
