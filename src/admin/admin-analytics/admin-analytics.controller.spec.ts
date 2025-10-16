import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AdminAnalyticsController', () => {
  let controller: AdminAnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [AdminAnalyticsService],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
