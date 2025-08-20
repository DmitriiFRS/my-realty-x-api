import { Controller } from '@nestjs/common';
import { EstatesService } from './estates.service';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}
}
