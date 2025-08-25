import { Body, Controller, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { EstatesService } from './estates.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateEstateDto } from './dto/create-estate.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('mediaFiles', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|webp)/)) {
          return cb(new Error('Только изображения'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createEstate(@GetUser('id') userId: number, @Body() dto: CreateEstateDto, @UploadedFiles() mediaFiles: Array<Express.Multer.File>) {
    return this.estatesService.createEstate(userId, dto, mediaFiles);
  }
}
