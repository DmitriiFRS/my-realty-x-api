import { Controller, Get, Headers } from '@nestjs/common';
import { CurrencyTypesService } from './currency-types.service';

@Controller('currency-types')
export class CurrencyTypesController {
  constructor(private readonly currencyTypesService: CurrencyTypesService) {}

  @Get()
  getCurrencyTypes(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.currencyTypesService.findMany(locale);
  }
}
