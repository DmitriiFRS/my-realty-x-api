import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [DistrictsController],
  providers: [DistrictsService, PrismaService, TranslationService],
})
export class DistrictsModule {}
