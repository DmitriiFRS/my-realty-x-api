import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EstatesService } from './estates.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateEstateDto } from './dto/create-estate.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UpdateEstateDto } from './dto/update-estate.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { GetFilteredEstatesDto } from './dto/get-filtered-estates.dto';
// import { GetUser } from 'src/common/decorators/get-user.decorator';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('estates')
export class EstatesController {
  constructor(private readonly estatesService: EstatesService) {}

  @Get('offers')
  async getOffersEstate(@Query() query: PaginationDto) {
    return this.estatesService.getOffers(query.page, query.limit);
  }

  @Get('pending')
  async getPendingEstates() {
    return this.estatesService.getPendingEstates();
  }
  @Get('active')
  async getVerifiedEstates() {
    return this.estatesService.getVerifiedEstates();
  }
  @Get('rejected')
  async getRejectedEstates() {
    return this.estatesService.getRejectedEstates();
  }

  @Get('/estate/:id')
  async getEstateById(@Param('id') id: number) {
    return this.estatesService.getEstateById(8, id);
  }

  @Get('estate/slug/:slug')
  async getEstateBySlug(@Param('slug') slug: string) {
    return this.estatesService.getEstateBySlug(slug);
  }

  @Get('filtered')
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: false,
    }),
  )
  async getFilteredEstates(@Query() query: GetFilteredEstatesDto) {
    console.log(query);
    return this.estatesService.getFilteredEstates(query);
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

  @Delete('/admin-delete/:id')
  async deleteEstateByAdmin(@Param('id') id: number) {
    return this.estatesService.adminDeleteEstate(5, id);
  }
}
