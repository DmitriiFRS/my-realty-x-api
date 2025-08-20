import { Controller, Get, Headers } from '@nestjs/common';
import { EstateTypesService } from './estate-types.service';

@Controller('estate-types')
export class EstateTypesController {
  constructor(private readonly estateTypesService: EstateTypesService) {}

  @Get()
  getEstateTypes(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.estateTypesService.findMany(locale);
  }
}
