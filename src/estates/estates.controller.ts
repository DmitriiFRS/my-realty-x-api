import { Body, Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { EstatesService } from './estates.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateEstateDto } from './dto/create-estate.dto';
// import { GetUser } from 'src/common/decorators/get-user.decorator';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}

  @Get('pending')
  async getAllEstates() {
    return this.estatesService.getPendingEstates();
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
