import { Module } from '@nestjs/common';
import { EstateTypesService } from './estate-types.service';
import { EstateTypesController } from './estate-types.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [EstateTypesController],
  providers: [EstateTypesService, PrismaService, TranslationService],
})
export class EstateTypesModule {}
