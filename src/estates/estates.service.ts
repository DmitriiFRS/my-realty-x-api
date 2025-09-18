import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { EntityType } from 'src/uploads/enums/entity-type.enum';
import { Prisma } from '@prisma/client';
import { getEstatesSelect } from './select/getEstates.select';
import { UpdateEstateDto } from './dto/update-estate.dto';
import { GetFilteredEstatesDto } from './dto/get-filtered-estates.dto';

@Injectable()
export class EstatesService {
  constructor(
    private readonly prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async getOffers(page: number = 1, limit: number = 4) {
    return this.getEstates(page, limit, { status: { status: 'VERIFIED' } }, { select: getEstatesSelect });
  }

  async getPendingEstates() {
    return this.getEstates(1, 10, { status: { status: 'PENDING' } }, { select: getEstatesSelect });
  }

  async getVerifiedEstates() {
    return this.getEstates(1, 10, { status: { status: 'VERIFIED' } }, { select: getEstatesSelect });
  }

  async getRejectedEstates() {
    return this.getEstates(
      1,
      10,
      { status: { status: 'REJECTED' } },
      {
        select: getEstatesSelect,
      },
    );
  }

  async getEstateBySlug(slug: string) {
    const estate = await this.prisma.estate.findUnique({
      where: { slug },
      include: {
        features: {
          select: { id: true, name: true, slug: true },
        },
        city: {
          select: { id: true, name: true, slug: true },
        },
        district: {
          select: { id: true, name: true, slug: true },
        },
        room: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!estate) return new NotFoundException('Объявление не найдено');
    const media = await this.uploadsService.getMediaById(EntityType.ESTATE, estate.id);
    return { data: { ...estate, media } };
  }

  async getFilteredEstates(dto: GetFilteredEstatesDto) {
    const { cityId, districtId, areaFrom, areaTo, currencyTypeId, dealTermId, priceFrom, priceTo, features, page = 1, limit = 2 } = dto;

    const filters: Prisma.EstateWhereInput = {
      status: { status: 'VERIFIED' },
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
      area: areaFrom || areaTo ? { gte: areaFrom ?? 0, lte: areaTo ?? 9999 } : undefined,
      currencyTypeId: currencyTypeId ? Number(currencyTypeId) : undefined,
      dealTermId: dealTermId ? Number(dealTermId) : undefined,
      price: priceFrom || priceTo ? { gte: priceFrom ?? 0, lte: priceTo ?? 1000000000000 } : undefined,
      features: features && features.length > 0 ? { some: { id: { in: features.map((id) => Number(id)) } } } : undefined,
    };

    const skip = (page - 1) * limit;
    const take = limit;

    const [estates, total] = await Promise.all([
      this.prisma.estate.findMany({
        where: filters,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: getEstatesSelect,
      }),
      this.prisma.estate.count({ where: filters }),
    ]);

    const estateIds = estates.map((estate) => estate.id);
    const media = await this.uploadsService.getMediaById(EntityType.ESTATE, estateIds);
    const estatesWithMedia = estates.map((estate) => ({
      ...estate,
      media: media.filter((m) => m.entityId === estate.id),
    }));

    return {
      data: estatesWithMedia,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async createEstate(userId: number, dto: CreateEstateDto, files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] }) {
    if (!files.primaryImage || files.primaryImage.length === 0) {
      throw new BadRequestException('Для создания объявления требуется хотя бы одно изображение.');
    }
    const { area, description, price, currencyTypeId, dealTermId, districtId, estateTypeId, roomId, features } = dto;

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
          city: { connect: { id: dto.cityId } },
          currencyType: { connect: { id: currencyTypeId } },
          dealTerm: { connect: { id: dealTermId } },
          district: { connect: { id: districtId } },
          estateType: { connect: { id: estateTypeId } },
          room: roomId ? { connect: { id: roomId } } : undefined,
          features:
            features && features.length > 0
              ? {
                  connect: features.map((id) => ({ id })),
                }
              : undefined,
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

  async getEstateById(userId: number, estateId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      select: getEstatesSelect,
    });
    if (!estate) throw new BadRequestException('Объявление не найдено');
    const media = await this.uploadsService.getMediaById(EntityType.ESTATE, estateId);
    const filteredMedia = media.filter((m) => m.id !== estate.EstatePrimaryMedia?.id);

    const estateWithMedia = {
      ...estate,
      media: filteredMedia,
    };

    return {
      data: estateWithMedia,
    };
  }

  async getFavoriteEstates(ids: number[], page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const take = limit;
    const estates = await this.prisma.estate.findMany({
      where: { id: { in: ids }, status: { status: 'VERIFIED' } },
      include: {
        city: { select: { id: true, name: true, slug: true } },
        district: { select: { id: true, name: true, slug: true } },
        estateType: { select: { id: true, name: true, slug: true } },
        room: { select: { id: true, name: true, slug: true } },
        features: { select: { id: true, name: true, slug: true } },
        EstatePrimaryMedia: true,
      },
      skip,
      take,
    });
    if (!estates || estates.length === 0) {
      throw new NotFoundException('Нет избранных объявлений');
    }
    const total = await this.prisma.estate.count({
      where: { id: { in: ids }, status: { status: 'VERIFIED' } },
    });

    const estateIds = estates.map((estate) => estate.id);
    const media = await this.prisma.media.findMany({
      where: {
        entityType: 'estate',
        entityId: { in: estateIds },
      },
    });
    const estatesWithMedia = estates.map((estate) => ({
      ...estate,
      media: media.filter((m) => m.entityId === estate.id),
    }));
    return {
      data: estatesWithMedia,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEstatesByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.getEstates(1, 20, { userId: user.id }, { select: getEstatesSelect });
  }

  async adminUpdateEstate(
    userId: number,
    estateId: number,
    dto: UpdateEstateDto,
    files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.updateEstate({ estateId, dto, files });
  }

  async userUpdateEstate(
    userId: number,
    estateId: number,
    dto: UpdateEstateDto,
    files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.updateEstate({ estateUserId: user.id, estateId, dto, files, isUser: true });
  }

  async adminDeleteEstate(userId: number, estateId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.deleteEstate(estateId);
  }

  /* =================== PRIVATE ================== */
  private async updateEstate({
    estateUserId,
    estateId,
    dto,
    files,
    isUser,
  }: {
    estateId: number;
    dto: UpdateEstateDto;
    files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] };
    estateUserId?: number;
    isUser?: boolean | undefined;
  }) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
    });
    if (!estate) throw new BadRequestException('Объявление не найдено');
    if (isUser && estate.userId !== estateUserId) throw new BadRequestException('Редактировать объявление может только его создатель');

    const { area, description, price, currencyTypeId, dealTermId, districtId, estateTypeId, roomId, features, status, existingImageIds } =
      dto;
    const newPrimaryImageFile = files?.primaryImage?.[0];
    const newImageFiles = files?.images || [];
    const primaryId = estate.primaryMediaId ?? null;
    console.log(existingImageIds);
    return this.prisma.$transaction(async (prisma) => {
      const currentMedia = await prisma.media.findMany({
        where: {
          entityId: estateId,
          entityType: EntityType.ESTATE,
        },
        select: { id: true, url: true },
      });

      const currentIds = currentMedia.map((m) => m.id);
      if (Array.isArray(existingImageIds)) {
        if (existingImageIds.length === 0) {
          const idsToDelete = currentIds.filter((id) => id !== primaryId);
          if (idsToDelete.length > 0) {
            await prisma.media.deleteMany({ where: { id: { in: idsToDelete } } });
            const mediaToDelete = currentMedia.filter((m) => idsToDelete.includes(m.id));
            await this.uploadsService.deleteFiles(mediaToDelete.map((m) => m.url));
          }
        } else {
          const idsToDelete = currentIds.filter((id) => !existingImageIds.includes(id) && id !== primaryId);
          if (idsToDelete.length > 0) {
            await prisma.media.deleteMany({
              where: {
                id: { in: idsToDelete },
              },
            });
            const mediaToDelete = currentMedia.filter((m) => idsToDelete.includes(m.id));
            await this.uploadsService.deleteFiles(mediaToDelete.map((m) => m.url));
          }
        }
      }
      if (newImageFiles.length > 0) {
        await Promise.all(
          newImageFiles.map(async (file) => {
            const imageUrl = await this.uploadsService.saveFile(file);
            return prisma.media.create({
              data: {
                url: imageUrl,
                size: file.size,
                entityId: estateId,
                entityType: EntityType.ESTATE,
              },
            });
          }),
        );
      }

      let primaryImageUpdateData = {};
      if (newPrimaryImageFile) {
        const primaryImageUrl = await this.uploadsService.saveFile(newPrimaryImageFile);
        const primaryMedia = await prisma.media.create({
          data: {
            url: primaryImageUrl,
            size: newPrimaryImageFile.size,
            entityId: estateId,
            entityType: EntityType.ESTATE,
            order: 0,
          },
        });
        primaryImageUpdateData = {
          primaryMediaId: primaryMedia.id,
          primaryImageUrl: primaryMedia.url,
        };
      }

      const estate = await prisma.estate.update({
        where: { id: estateId },
        data: {
          description,
          area,
          price,
          currencyType: { connect: { id: currencyTypeId } },
          dealTerm: { connect: { id: dealTermId } },
          district: { connect: { id: districtId } },
          estateType: { connect: { id: estateTypeId } },
          room: roomId ? { connect: { id: roomId } } : undefined,
          features: features !== undefined ? { set: features.map((id) => ({ id })) } : undefined,
          ...primaryImageUpdateData,
        },
      });

      if (!isUser && status) {
        await prisma.estateStatus.upsert({
          where: { estateId: estate.id },
          create: {
            status: status,
            estateId: estate.id,
          },
          update: {
            status: status,
          },
        });
      } else {
        await prisma.estateStatus.upsert({
          where: { estateId: estate.id },
          create: {
            status: 'PENDING',
            estateId: estate.id,
          },
          update: {
            status: 'PENDING',
          },
        });
      }
      return estate;
    });
  }

  private async getEstates(
    page: number = 1,
    pageSize: number = 4,
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
        orderBy: { createdAt: 'desc' },
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
      media: media.filter((m) => m.entityId === estate.id && m.id !== estate.primaryMediaId),
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

  private async deleteEstate(estateId: number) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      include: {
        EstatePrimaryMedia: true,
      },
    });
    if (!estate) throw new BadRequestException('Объявление не найдено');

    const mediaToDelete = await this.prisma.media.findMany({
      where: {
        entityId: estateId,
        entityType: EntityType.ESTATE,
      },
      select: {
        url: true, // Нам нужны только их URL
      },
    });
    const urlsToDelete = mediaToDelete.map((media) => media.url);

    return this.prisma.$transaction(async (prisma) => {
      await prisma.media.deleteMany({
        where: {
          entityId: estateId,
          entityType: EntityType.ESTATE,
        },
      });
      await prisma.estate.delete({
        where: { id: estateId },
      });
      if (urlsToDelete.length > 0) {
        await this.uploadsService.deleteFiles(urlsToDelete);
      }
      return { message: 'Объявление и связанные файлы успешно удалены' };
    });
  }
}
