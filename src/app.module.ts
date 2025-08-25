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
import { RoomsModule } from './rooms/rooms.module';
import { CitiesModule } from './cities/cities.module';
import { CurrencyTypesModule } from './currency-types/currency-types.module';

@Module({
  imports: [UsersModule, EstateTypesModule, DistrictsModule, DealTermsModule, EstatesModule, UploadsModule, RoomsModule, CitiesModule, CurrencyTypesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
