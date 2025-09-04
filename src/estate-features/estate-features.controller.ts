import { Controller, Get, Headers } from '@nestjs/common';
import { EstateFeaturesService } from './estate-features.service';

@Controller('estate-features')
export class EstateFeaturesController {
  constructor(private readonly estateFeaturesService: EstateFeaturesService) {}

  @Get()
  getEstateFeatures(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.estateFeaturesService.findMany(locale);
  }
}
