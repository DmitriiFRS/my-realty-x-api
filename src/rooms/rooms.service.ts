import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';
import { PropertyEntityService } from 'src/common/services/property-entity-service';
import { CreateRoomDto } from './dto/create-room.dto';
import { PrismaService } from 'src/prisma.service';
import { TranslationService } from 'src/common/services/translation-service';

@Injectable()
export class RoomsService extends PropertyEntityService<Room, CreateRoomDto> {
  constructor(prisma: PrismaService, translationService: TranslationService) {
    super(prisma, 'Room', translationService);
  }
}
