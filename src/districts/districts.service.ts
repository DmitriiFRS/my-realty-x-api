import { Injectable } from '@nestjs/common';
import { District } from '@prisma/client';
import { PropertyEntityService } from 'src/common/services/property-entity-service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Injectable()
export class DistrictsService extends PropertyEntityService<
  District,
  CreateDistrictDto
> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'District', translationService);
  }
}
