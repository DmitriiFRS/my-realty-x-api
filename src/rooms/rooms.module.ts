import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService, TranslationService],
})
export class RoomsModule {}
