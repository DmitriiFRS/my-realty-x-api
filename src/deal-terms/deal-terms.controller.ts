import { Controller, Get, Headers } from '@nestjs/common';
import { DealTermsService } from './deal-terms.service';

@Controller('deal-terms')
export class DealTermsController {
  constructor(private readonly dealTermsService: DealTermsService) {}

  @Get()
  getDealTerms(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.dealTermsService.findMany(locale);
  }
}
