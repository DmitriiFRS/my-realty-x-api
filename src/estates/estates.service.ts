import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { EntityType } from 'src/uploads/enums/entity-type.enum';

@Injectable()
export class EstatesService {
  constructor(
    private readonly prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async getAllEstates() {
    return this.prisma.estate.findMany();
  }

  async createEstate(userId: number, dto: CreateEstateDto, mediaFiles: Array<Express.Multer.File>) {
    if (!mediaFiles || mediaFiles.length === 0) {
      throw new BadRequestException('Для создания объявления требуется хотя бы одно изображение.');
    }
    const { area, description, price, currencyTypeId, dealTermId, districtId, estateTypeId, roomId } = dto;

    const timestamp = Date.now().toString().slice(-8);
    const uniqueSlug = timestamp + '-' + Math.random().toString(36).substring(2, 8);
    const primaryImageFile = mediaFiles[0];
    const otherImageFiles = mediaFiles.slice(1);

    return this.prisma.$transaction(async (prisma) => {
      const estate = await prisma.estate.create({
        data: {
          user: { connect: { id: userId } },
          slug: uniqueSlug,
          description,
          area,
          price,
          currencyType: { connect: { id: currencyTypeId } },
          dealTerm: { connect: { id: dealTermId } },
          district: { connect: { id: districtId } },
          estateType: { connect: { id: estateTypeId } },
          room: roomId ? { connect: { id: roomId } } : undefined,
        },
      });

      await prisma.estateStatus.create({
        data: {
          status: 'PENDING',
          estateId: estate.id,
        },
      });

      const primaryImageUrl = await this.uploadsService.saveFile(primaryImageFile);
      const primaryMedia = await prisma.media.create({
        data: {
          url: primaryImageUrl,
          size: primaryImageFile.size,
          entityId: estate.id,
          entityType: EntityType.ESTATE,
          order: 0,
        },
      });
      const updatedEstate = await prisma.estate.update({
        where: { id: estate.id },
        data: {
          primaryMediaId: primaryMedia.id,
          primaryImageUrl: primaryMedia.url,
        },
      });

      if (otherImageFiles.length > 0) {
        await Promise.all(
          otherImageFiles.map(async (file, index) => {
            const imageUrl = await this.uploadsService.saveFile(file);
            return prisma.media.create({
              data: {
                url: imageUrl,
                size: file.size,
                entityId: estate.id,
                entityType: EntityType.ESTATE,
                order: index + 1,
              },
            });
          }),
        );
      }
      return updatedEstate;
    });
  }
}
