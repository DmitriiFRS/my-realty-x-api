import { Module } from '@nestjs/common';
import { CurrencyTypesService } from './currency-types.service';
import { CurrencyTypesController } from './currency-types.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [CurrencyTypesController],
  providers: [CurrencyTypesService, PrismaService, TranslationService],
})
export class CurrencyTypesModule {}
