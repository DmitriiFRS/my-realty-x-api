import { Injectable } from '@nestjs/common';
import { CurrencyType } from '@prisma/client';
import { PropertyEntityService } from 'src/common/services/property-entity-service';
import { CreateCurrencyTypeDto } from './dto/create-currency-type.dto';
import { TranslationService } from 'src/common/services/translation-service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CurrencyTypesService extends PropertyEntityService<CurrencyType, CreateCurrencyTypeDto> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'CurrencyType', translationService, false);
  }
}
