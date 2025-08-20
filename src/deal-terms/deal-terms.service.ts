import { Injectable } from '@nestjs/common';
import { DealTerm } from '@prisma/client';
import { PropertyEntityService } from 'src/common/services/property-entity-service';
import { PrismaService } from 'src/prisma.service';
import { CreateDealTermDto } from './dto/create-deal-term.dto';
import { TranslationService } from 'src/common/services/translation-service';

@Injectable()
export class DealTermsService extends PropertyEntityService<
  DealTerm,
  CreateDealTermDto
> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'DealTerm', translationService);
  }
}
