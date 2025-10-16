import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FindOrCreateTgDto } from './dto/findOrCreateTg.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateReminderDto } from './dto/updateReminder.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('get-me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser('id') userId: number) {
    return this.usersService.getMe(userId);
  }

  @Get('get-me-admin')
  @UseGuards(JwtAuthGuard)
  async getAdmin(@GetUser('id') userId: number) {
    return this.usersService.getAdmin(userId);
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

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(@GetUser('id') userId: number, @Query() query: SearchUsersDto) {
    return this.usersService.searchUsers(userId, query);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  async getUsersCount(@GetUser('id') userId: number) {
    return await this.usersService.getUsersCount(userId);
  }

  @Get('role/:roleSlug')
  @UseGuards(JwtAuthGuard)
  async getUsersByRole(@GetUser('id') userId: number, @Param('roleSlug') roleSlug: string) {
    return this.usersService.getUsersByRole(userId, roleSlug);
  }
}
