import { Test, TestingModule } from '@nestjs/testing';
import { EstatesService } from './estates.service';

describe('EstatesService', () => {
  let service: EstatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstatesService],
    }).compile();

    service = module.get<EstatesService>(EstatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
