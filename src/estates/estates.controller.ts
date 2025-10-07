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
import { GetFavoritesDto } from './dto/get-favorites.dto';
import { CreateLeaseAgreementDto } from './dto/create-lease-agreement.dto';
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

  @Get('favorites')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFavoriteEstates(@Query() query: GetFavoritesDto) {
    return this.estatesService.getFavoriteEstates(query.ids, query.page, query.limit);
  }

  @Get('my-estates')
  @UseGuards(JwtAuthGuard)
  async getMyEstates(@GetUser('id') userId: number) {
    return await this.estatesService.getEstatesByUserId(userId);
  }

  @Get('filtered')
  @UsePipes(
    new ValidationPipe({
      forbidNonWhitelisted: false,
    }),
  )
  async getFilteredEstates(@Query() query: GetFilteredEstatesDto) {
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
    @GetUser('id') userId: number,
    @Param('id') id: number,
    @Body() dto: UpdateEstateDto,
    @UploadedFiles() files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.estatesService.userUpdateEstate(userId, id, dto, files);
  }

  @Post('create')
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
  async createEstate(
    @GetUser('id') userId: number,
    @Body() dto: CreateEstateDto,
    @UploadedFiles() files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] },
  ) {
    return this.estatesService.createEstate(userId, dto, files);
  }

  @Delete('/admin-delete/:id')
  async deleteEstateByAdmin(@Param('id') id: number) {
    return this.estatesService.adminDeleteEstate(5, id);
  }
  /* ============================Realtor crm================================= */

  @Get('crm/my-estates')
  @UseGuards(JwtAuthGuard)
  async getRealtorEstates(@GetUser('id') userId: number) {
    return this.estatesService.getEstatesByUserId(userId);
  }

  @Get('crm/estates/free')
  @UseGuards(JwtAuthGuard)
  async getFreeEstates(@GetUser('id') userId: number) {
    return this.estatesService.getFreeEstates(userId);
  }

  @Get('crm/estates/sold')
  @UseGuards(JwtAuthGuard)
  async getSoldEstates(@GetUser('id') userId: number) {
    return this.estatesService.getSoldEstates(userId);
  }

  @Get('crm/estates/estate/:slug')
  @UseGuards(JwtAuthGuard)
  async getCrmEstateBySlug(@GetUser('id') userId: number, @Param('slug') slug: number) {
    console.log('slug', slug);
    return this.estatesService.getCrmEstateBySlug(userId, slug);
  }

  @Post('lease/create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'photos', maxCount: 10 }, // для "Фотографии в день сдачи"
      { name: 'document', maxCount: 1 }, // для "Документы" (1 файл)
    ]),
  )
  async create(
    @GetUser('id') userId: number,
    @Body() dto: CreateLeaseAgreementDto,
    @UploadedFiles() files: { photos?: Express.Multer.File[]; document?: Express.Multer.File[] },
  ) {
    return this.estatesService.createLeaseAgreement(userId, dto, files);
  }
  @Put('crm/update/:id')
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
  async updateEstate(
    @GetUser('id') userId: number,
    @Param('id') id: number,
    @Body() dto: UpdateEstateDto,
    @UploadedFiles() files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    return this.estatesService.userUpdateEstate(userId, id, dto, files);
  }
  @Delete('crm/delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteEstateByUser(@GetUser('id') userId: number, @Param('id') id: number) {
    return this.estatesService.adminDeleteEstate(userId, id);
  }
}
