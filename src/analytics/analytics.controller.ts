import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getAnalyticsSummary(@GetUser('id') userId: number) {
    return this.analyticsService.getAnalyticsSummary(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactionAnalytics(@GetUser('id') userId: number) {
    return this.analyticsService.getTransactionAnalytics(userId);
  }

  @Get('chart')
  @UseGuards(JwtAuthGuard)
  getChartData(@GetUser('id') userId: number) {
    return this.analyticsService.getChartData(userId);
  }

  @Get('exclusives')
  @UseGuards(JwtAuthGuard)
  getExclusiveAnalytics(@GetUser('id') userId: number) {
    return this.analyticsService.getExclusiveAnalytics(userId);
  }
}
