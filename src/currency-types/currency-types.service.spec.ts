import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyTypesService } from './currency-types.service';

describe('CurrencyTypesService', () => {
  let service: CurrencyTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CurrencyTypesService],
    }).compile();

    service = module.get<CurrencyTypesService>(CurrencyTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
