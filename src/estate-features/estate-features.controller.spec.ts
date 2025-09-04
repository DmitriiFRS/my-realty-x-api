import { Test, TestingModule } from '@nestjs/testing';
import { EstateFeaturesController } from './estate-features.controller';
import { EstateFeaturesService } from './estate-features.service';

describe('EstateFeaturesController', () => {
  let controller: EstateFeaturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstateFeaturesController],
      providers: [EstateFeaturesService],
    }).compile();

    controller = module.get<EstateFeaturesController>(EstateFeaturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
