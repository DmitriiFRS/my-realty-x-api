import { Test, TestingModule } from '@nestjs/testing';
import { DealTermsService } from './deal-terms.service';

describe('DealTermsService', () => {
  let service: DealTermsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DealTermsService],
    }).compile();

    service = module.get<DealTermsService>(DealTermsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
