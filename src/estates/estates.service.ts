import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { EntityType } from 'src/uploads/enums/entity-type.enum';
import { Prisma } from '@prisma/client';
import { getEstatesSelect } from './select/getEstates.select';

@Injectable()
export class EstatesService {
  constructor(
    private readonly prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async getPendingEstates() {
    return this.getEstates(
      1,
      10,
      { status: { status: 'PENDING' } },
      {
        select: getEstatesSelect,
      },
    );
  }

  private async getEstates(
    page: number = 1,
    pageSize: number = 10,
    where: Prisma.EstateWhereInput,
    queryArgs: {
      select?: Prisma.EstateSelect;
      include?: Prisma.EstateInclude;
    },
  ) {
    if (page < 1 || pageSize < 1) {
      throw new BadRequestException('Номер страницы и размер страницы должны быть положительными числами.');
    }
    const skip = (page - 1) * pageSize;
    const [estates, totalCount] = await Promise.all([
      this.prisma.estate.findMany({
        skip,
        take: pageSize,
        where,
        ...queryArgs,
      }),
      this.prisma.estate.count({ where }),
    ]);

    const estateIds = estates.map((estate) => estate.id);
    const media = await this.prisma.media.findMany({
      where: {
        entityType: EntityType.ESTATE,
        entityId: { in: estateIds },
      },
      select: {
        id: true,
        order: true,
        url: true,
        size: true,
        entityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const estatesWithMedia = estates.map((estate) => ({
      ...estate,
      media: media.filter((m) => m.entityId === estate.id),
    }));

    return {
      data: estatesWithMedia,
      meta: {
        total: totalCount,
        page,
        pageSize,
        lastPage: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async createEstate(userId: number, dto: CreateEstateDto, files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] }) {
    if (!files.primaryImage || files.primaryImage.length === 0) {
      throw new BadRequestException('Для создания объявления требуется хотя бы одно изображение.');
    }
    const { area, description, price, currencyTypeId, dealTermId, districtId, estateTypeId, roomId } = dto;

    const timestamp = Date.now().toString().slice(-8);
    const randomPart = Math.random().toString().substring(2, 8);
    const uniqueSlug = (randomPart + timestamp).slice(0, 10);
    const primaryImageFile = files.primaryImage[0];
    const otherImageFiles = files.images || [];

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
