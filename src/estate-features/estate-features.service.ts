import { Injectable } from '@nestjs/common';
import { PropertyEntityService } from 'src/common/services/property-entity-service';
import { CreateEstateFeatureDto } from './dto/create-estate-feature.dto';
import { EstateFeature } from '@prisma/client';
import { TranslationService } from 'src/common/services/translation-service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class EstateFeaturesService extends PropertyEntityService<EstateFeature, CreateEstateFeatureDto> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'EstateFeature', translationService);
  }
}
