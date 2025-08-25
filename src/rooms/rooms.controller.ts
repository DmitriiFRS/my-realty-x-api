import { Controller, Get, Headers } from '@nestjs/common';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  getDistricts(@Headers() headers: Record<string, string>) {
    const locale = headers['accept-language'] || 'ru';
    return this.roomsService.findMany(locale);
  }
}
