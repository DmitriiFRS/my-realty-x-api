import { Test, TestingModule } from '@nestjs/testing';
import { EstateTypesService } from './estate-types.service';

describe('EstateTypesService', () => {
  let service: EstateTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstateTypesService],
    }).compile();

    service = module.get<EstateTypesService>(EstateTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
