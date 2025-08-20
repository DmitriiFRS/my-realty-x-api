import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { EstateTypesModule } from './estate-types/estate-types.module';
import { DistrictsModule } from './districts/districts.module';
import { DealTermsModule } from './deal-terms/deal-terms.module';
import { EstatesModule } from './estates/estates.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [UsersModule, EstateTypesModule, DistrictsModule, DealTermsModule, EstatesModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
