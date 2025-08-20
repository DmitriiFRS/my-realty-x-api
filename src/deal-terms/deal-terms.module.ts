import { Module } from '@nestjs/common';
import { DealTermsService } from './deal-terms.service';
import { DealTermsController } from './deal-terms.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [DealTermsController],
  providers: [DealTermsService, PrismaService, TranslationService],
})
export class DealTermsModule {}
