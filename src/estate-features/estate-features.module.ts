import { Module } from '@nestjs/common';
import { EstateFeaturesService } from './estate-features.service';
import { EstateFeaturesController } from './estate-features.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [EstateFeaturesController],
  providers: [EstateFeaturesService, PrismaService, TranslationService],
})
export class EstateFeaturesModule {}
