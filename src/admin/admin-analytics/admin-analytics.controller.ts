import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('admin-analytics')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  async getCategoriesChart(@GetUser('id') userId: number) {
    return this.adminAnalyticsService.getCategoriesChart(userId);
  }

  @Get('estates-monthly')
  @UseGuards(JwtAuthGuard)
  getMonthlyEstateCounts() {
    return this.adminAnalyticsService.getMonthlyEstateCounts();
  }

  @Get('estates-daily')
  @UseGuards(JwtAuthGuard)
  getDailyEstateCounts() {
    return this.adminAnalyticsService.getDailyEstateCounts();
  }

  @Get('users-daily')
  @UseGuards(JwtAuthGuard)
  getDailyUsersCount() {
    return this.adminAnalyticsService.getDailyUsersCount();
  }
}
