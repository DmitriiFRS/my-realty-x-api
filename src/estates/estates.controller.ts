import { Body, Controller, Get, Param, Post, Put, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstatesService } from './estates.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateEstateDto } from './dto/create-estate.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateEstateDto } from './dto/update-estate.dto';
// import { GetUser } from 'src/common/decorators/get-user.decorator';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}

  @Get('pending')
  async getAllEstates() {
    return this.estatesService.getPendingEstates();
  }
  @Get('/estate/:id')
  async getEstateById(@Param('id') id: number) {
    return this.estatesService.getEstateById(8, id);
  }

  @Put('/admin-update/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)/)) {
            return cb(new Error('Только изображения'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async updateEstateByAdmin(
    @Param('id') id: number,
    @Body() dto: UpdateEstateDto,
    @UploadedFiles() files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.estatesService.adminUpdateEstate(8, id, dto, files);
  }

  @Put('/update/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)/)) {
            return cb(new Error('Только изображения'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async editEstateByUser(
    @GetUser('sub') userId: number,
    @Param('id') id: number,
    @Body() dto: UpdateEstateDto,
    @UploadedFiles() files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.estatesService.userUpdateEstate(userId, id, dto, files);
  }

  @Post('create')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'images', maxCount: 10 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)/)) {
            return cb(new Error('Только изображения'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async createEstate(
    // @GetUser('id') userId: number,
    @Body() dto: CreateEstateDto,
    @UploadedFiles() files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] },
  ) {
    return this.estatesService.createEstate(5, dto, files);
  }
}
