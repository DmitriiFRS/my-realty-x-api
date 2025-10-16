import { Module } from '@nestjs/common';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService, PrismaService],
})
export class AdminAnalyticsModule {}
