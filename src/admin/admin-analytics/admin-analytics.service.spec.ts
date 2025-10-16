import { Test, TestingModule } from '@nestjs/testing';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminAnalyticsService],
    }).compile();

    service = module.get<AdminAnalyticsService>(AdminAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
