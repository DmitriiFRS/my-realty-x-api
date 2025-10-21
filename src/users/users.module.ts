import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { UploadsService } from 'src/uploads/uploads.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, UploadsService],
  exports: [UsersService],
})
export class UsersModule {}
