import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyTypesController } from './currency-types.controller';
import { CurrencyTypesService } from './currency-types.service';

describe('CurrencyTypesController', () => {
  let controller: CurrencyTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CurrencyTypesController],
      providers: [CurrencyTypesService],
    }).compile();

    controller = module.get<CurrencyTypesController>(CurrencyTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
