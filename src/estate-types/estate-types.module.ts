import { Module } from '@nestjs/common';
import { EstateTypesService } from './estate-types.service';
import { EstateTypesController } from './estate-types.controller';

@Module({
  controllers: [EstateTypesController],
  providers: [EstateTypesService],
})
export class EstateTypesModule {}
