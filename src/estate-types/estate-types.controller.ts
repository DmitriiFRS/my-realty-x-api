import { Controller } from '@nestjs/common';
import { EstateTypesService } from './estate-types.service';

@Controller('estate-types')
export class EstateTypesController {
  constructor(private readonly estateTypesService: EstateTypesService) {}
}
