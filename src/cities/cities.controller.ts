import { Controller, Get, Headers } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  getCities(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.citiesService.findMany(locale, { districts: { select: { id: true, name: true, slug: true } } });
  }
}
