import { Test, TestingModule } from '@nestjs/testing';
import { EstateFeaturesService } from './estate-features.service';

describe('EstateFeaturesService', () => {
  let service: EstateFeaturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstateFeaturesService],
    }).compile();

    service = module.get<EstateFeaturesService>(EstateFeaturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
