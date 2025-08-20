import { Test, TestingModule } from '@nestjs/testing';
import { DealTermsController } from './deal-terms.controller';
import { DealTermsService } from './deal-terms.service';

describe('DealTermsController', () => {
  let controller: DealTermsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DealTermsController],
      providers: [DealTermsService],
    }).compile();

    controller = module.get<DealTermsController>(DealTermsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
