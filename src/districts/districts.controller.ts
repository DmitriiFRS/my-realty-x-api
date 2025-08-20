import { Controller, Get, Headers } from '@nestjs/common';
import { DistrictsService } from './districts.service';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  getDistricts(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.districtsService.findMany(locale);
  }
}
