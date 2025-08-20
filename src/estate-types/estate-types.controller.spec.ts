import { Test, TestingModule } from '@nestjs/testing';
import { EstateTypesController } from './estate-types.controller';
import { EstateTypesService } from './estate-types.service';

describe('EstateTypesController', () => {
  let controller: EstateTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstateTypesController],
      providers: [EstateTypesService],
    }).compile();

    controller = module.get<EstateTypesController>(EstateTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
