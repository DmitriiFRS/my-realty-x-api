import { Injectable } from '@nestjs/common';
import { City } from '@prisma/client';
import { CreateCityDto } from './dto/create-city.dto';
import { TranslationService } from 'src/common/services/translation-service';
import { PrismaService } from 'src/prisma.service';
import { PropertyEntityService } from 'src/common/services/property-entity-service';

@Injectable()
export class CitiesService extends PropertyEntityService<City, CreateCityDto> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'City', translationService);
  }
}
