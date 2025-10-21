import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateEstateDto } from './dto/create-estate.dto';
import { UploadsService } from 'src/uploads/uploads.service';
import { EntityType } from 'src/uploads/enums/entity-type.enum';
import { Prisma, ReactionType } from '@prisma/client';
import { getEstatesSelect } from './select/getEstates.select';
import { UpdateEstateDto } from './dto/update-estate.dto';
import { GetFilteredEstatesDto } from './dto/get-filtered-estates.dto';
import { getCrmEstateSelect } from './select/getCrmEstate.select';
import { CreateLeaseAgreementDto } from './dto/create-lease-agreement.dto';
import { getCrmListEstatesSelect } from './select/getCrmListEstates.select';
import { UpdateAdminEstateDto } from './dto/update-admin-estate.dto';
import { CreateAdminEstateDto } from './dto/create-admin-estate.dto';

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
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
    });

    if (!estate) return new NotFoundException('Объявление не найдено');
    const media = await this.uploadsService.getMediaById(EntityType.ESTATE, estate.id);
    return { data: { ...estate, media } };
  }

  async getFilteredEstates(dto: GetFilteredEstatesDto) {
    const {
      cityId,
      districtId,
      areaFrom,
      areaTo,
      currencyTypeId,
      dealTermId,
      priceFrom,
      priceTo,
      features,
      estateTypeId,
      page = 1,
      limit = 2,
      sortBy,
      sortOrder,
    } = dto;

    console.log(dto);

    const filters: Prisma.EstateWhereInput = {
      status: { status: 'VERIFIED' },
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
      area: areaFrom || areaTo ? { gte: areaFrom ?? 0, lte: areaTo ?? 9999 } : undefined,
      currencyTypeId: currencyTypeId ? Number(currencyTypeId) : undefined,
      dealTermId: dealTermId ? Number(dealTermId) : undefined,
      price: priceFrom || priceTo ? { gte: priceFrom ?? 0, lte: priceTo ?? 1000000000000 } : undefined,
      features: features && features.length > 0 ? { some: { id: { in: features.map((id) => Number(id)) } } } : undefined,
      estateTypeId: estateTypeId ? Number(estateTypeId) : undefined,
    };

    // Определяем orderBy: default = price asc
    const direction: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    let orderBy: Prisma.EstateOrderByWithRelationInput = { price: 'asc' };

    if (sortBy === 'price') {
      orderBy = { price: direction };
    } else if (sortBy === 'date') {
      orderBy = { createdAt: direction };
    } else if (sortBy === 'area') {
      orderBy = { area: direction };
    } else {
      // если sortBy не задан — default price asc
      orderBy = { price: 'asc' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [estates, total] = await Promise.all([
      this.prisma.estate.findMany({
        where: filters,
        skip,
        take,
        orderBy,
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
        page: Number(page),
        limit: Number(limit),
        lastPage: Math.ceil(total / Number(limit)),
      },
    };
  }

  async createClientEstate(
    userId: number,
    dto: CreateEstateDto,
    files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] },
  ) {
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

  async getEstateById(estateId: number) {
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

  // это когда юзер получает недвиги по параметрам
  async getCrmEstatesByUserId(userId: number, filter?: 'archived' | 'exclusive' | 'all', page: number = 1, pageSize: number = 4) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const where: Prisma.EstateWhereInput = { userId };

    if (filter === 'archived') {
      where.isArchived = true;
    } else if (filter === 'exclusive') {
      where.isExclusive = true;
    }

    const queryArgs: { include: Prisma.EstateInclude } = {
      include: {
        EstatePrimaryMedia: true,
        status: true,
        city: true,
        district: true,
      },
    };

    return this.getEstates(page, pageSize, where, queryArgs);
  }

  //архивируем недвигу
  async archiveEstate(userId: number, estateId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    const id = Number(estateId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Некорректный id объявления');
    }

    const estate = await this.prisma.estate.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isArchived: true,
      },
    });

    if (!estate) throw new NotFoundException('Объявление не найдено');

    const userIsOwner = estate.userId === userId;
    if (!userIsOwner) {
      throw new ForbiddenException('Нет прав на архивирование этого объявления');
    }
    if (estate.isArchived) {
      return {
        message: 'Объявление уже в архиве',
        data: estate,
      };
    }
    const updatedEstate = await this.prisma.estate.update({
      where: { id },
      data: {
        isArchived: true,
      },
      include: {
        EstatePrimaryMedia: true,
        status: true,
        city: true,
        district: true,
      },
    });
    return {
      message: 'Объявление успешно заархивировано',
      data: updatedEstate,
    };
  }

  //Составляем договор и прокидываем в срм
  async createLeaseAgreement(
    userId: number,
    dto: CreateLeaseAgreementDto,
    files: { photos?: Express.Multer.File[]; document?: Express.Multer.File[] },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    const existingAgreement = await this.prisma.leaseAgreement.findFirst({
      where: {
        estateId: Number(dto.estateId),
      },
    });

    if (existingAgreement) {
      throw new BadRequestException('Договор для этого объекта уже существует.');
    }
    return this.prisma.$transaction(async (prisma) => {
      const newAgreement = await prisma.leaseAgreement.create({
        data: {
          tenantName: dto.tenantName,
          tenantPhone: dto.tenantPhone,
          rentAmount: BigInt(dto.rentAmount),
          depositAmount: BigInt(dto.depositAmount),
          endDate: dto.endDate,
          estateId: Number(dto.estateId),
          currencyTypeId: Number(dto.currencyTypeId),
        },
      });

      await prisma.estate.update({
        where: {
          id: Number(dto.estateId),
        },
        data: {
          availability: 'SOLD',
          isSentToCrm: true,
        },
      });

      await prisma.transaction.create({
        data: {
          amount: BigInt(dto.rentAmount),
          clientName: dto.tenantName,
          dealDate: new Date(),
          estateId: Number(dto.estateId),
          userId: userId,
        },
      });

      if (files && files.photos && files.photos.length > 0) {
        for (const photo of files.photos) {
          const fileUrl = await this.uploadsService.saveFile(photo);
          await prisma.media.create({
            data: {
              url: fileUrl,
              size: photo.size,
              entityId: newAgreement.id,
              entityType: EntityType.LEASE_PHOTOS,
            },
          });
        }
      }
      if (files && files.document && files.document.length > 0) {
        const docFile = files.document[0];
        const fileUrl = await this.uploadsService.saveFile(docFile);
        await prisma.media.create({
          data: {
            url: fileUrl,
            size: docFile.size,
            entityId: newAgreement.id,
            entityType: EntityType.LEASE_PDF,
          },
        });
      }

      return newAgreement;
    });
  }

  async getFreeEstates(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.getEstates(1, 20, { userId: user.id, availability: 'AVAILABLE' }, { select: getCrmListEstatesSelect });
  }

  async getSoldEstates(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.getEstates(1, 20, { userId: user.id, availability: 'SOLD' }, { select: getCrmListEstatesSelect });
  }

  async adminUpdateEstate(
    userId: number,
    estateId: number,
    dto: UpdateAdminEstateDto,
    files: { primaryImage?: Express.Multer.File[]; images?: Express.Multer.File[] },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.updateEstate({ estateUserId: dto.targetUserId, estateId, dto, files });
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

  async getCrmEstateBySlug(userId: number, estateSlug: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    const estate = await this.prisma.estate.findFirst({
      where: { slug: String(estateSlug), userId: user.id },
      select: getCrmEstateSelect,
    });
    if (!estate) throw new BadRequestException('Объявление не найдено');
    const media = await this.uploadsService.getMediaById(EntityType.ESTATE, estate.id);
    const document = await this.uploadsService.getMediaById(EntityType.LEASE_PDF, estate.leaseAgreement?.id);
    const filteredMedia = media.filter((m) => m.id !== estate.EstatePrimaryMedia?.id);

    const estateWithMedia = {
      ...estate,
      media: filteredMedia,
      document: document,
    };

    return {
      data: estateWithMedia,
    };
  }

  async getCrmListEstates(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    return this.getEstates(1, 20, { userId: user.id, isArchived: false }, { select: getCrmListEstatesSelect });
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
          user: estateUserId ? { connect: { id: estateUserId } } : undefined,
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

  private async createEstate(dto: CreateEstateDto, files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] }) {
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
          user: { connect: { id: 11 } },
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

  async createAdminEstate(
    userId: number,
    dto: CreateAdminEstateDto,
    files: { primaryImage: Express.Multer.File[]; images: Express.Multer.File[] },
  ) {
    if (!files.primaryImage || files.primaryImage.length === 0) {
      throw new BadRequestException('Для создания объявления требуется хотя бы одно изображение.');
    }
    const { area, description, price, currencyTypeId, dealTermId, districtId, estateTypeId, roomId, features, targetUserId } = dto;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      include: {
        role: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!existingUser || (existingUser.role.slug !== 'realtor' && existingUser.role.slug !== 'user')) {
      throw new BadRequestException('Вы не можете создавать объявления для администраторов или пользователь не найден');
    }

    const timestamp = Date.now().toString().slice(-8);
    const randomPart = Math.random().toString().substring(2, 8);
    const uniqueSlug = (randomPart + timestamp).slice(0, 10);
    const primaryImageFile = files.primaryImage[0];
    const otherImageFiles = files.images || [];

    return this.prisma.$transaction(async (prisma) => {
      const estate = await prisma.estate.create({
        data: {
          user: { connect: { id: targetUserId } },
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

  async getEstatesCount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');
    const count = await this.prisma.estate.count();
    return { count };
  }

  async toggleReaction(userId: number, estateId: number, requestedType: ReactionType) {
    const estate = await this.prisma.estate.findUnique({
      where: { id: estateId },
      select: { id: true, likes: true, dislikes: true },
    });
    if (!estate) throw new NotFoundException('Объявление не найдено');
    const existingReaction = await this.prisma.reaction.findFirst({
      where: { userId, estateId },
    });
    if (!existingReaction) {
      const [, updatedEstate] = await this.prisma.$transaction([
        this.prisma.reaction.create({
          data: { userId, estateId, type: requestedType },
        }),
        this.prisma.estate.update({
          where: { id: estateId },
          data: requestedType === ReactionType.LIKE ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } },
          select: { likes: true, dislikes: true },
        }),
      ]);
      return { action: 'created', likes: updatedEstate.likes, dislikes: updatedEstate.dislikes };
    }
    if (existingReaction.type === requestedType) {
      const [, updatedEstate] = await this.prisma.$transaction([
        this.prisma.reaction.delete({ where: { id: existingReaction.id } }),
        this.prisma.estate.update({
          where: { id: estateId },
          data: requestedType === ReactionType.LIKE ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } },
          select: { likes: true, dislikes: true },
        }),
      ]);
      return { action: 'deleted', likes: updatedEstate.likes, dislikes: updatedEstate.dislikes };
    }
    const oldType = existingReaction.type;
    const [, updatedEstate] = await this.prisma.$transaction([
      this.prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { type: requestedType },
      }),
      this.prisma.estate.update({
        where: { id: estateId },
        data: {
          ...(oldType === ReactionType.LIKE ? { likes: { decrement: 1 } } : { dislikes: { decrement: 1 } }),
          ...(requestedType === ReactionType.LIKE ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } }),
        },
        select: { likes: true, dislikes: true },
      }),
    ]);
    return { action: 'updated', likes: updatedEstate.likes, dislikes: updatedEstate.dislikes };
  }
  async getUserReaction(userId: number, estateId: number): Promise<'like' | 'dislike' | null> {
    const reaction = await this.prisma.reaction.findFirst({
      where: { userId, estateId },
      select: { type: true },
    });

    if (!reaction) return null;

    const lower = reaction.type.toLowerCase();
    return lower === 'like' ? 'like' : 'dislike';
  }

  async recalcEstateCounters(estateId: number) {
    const [likesCount, dislikesCount] = await Promise.all([
      this.prisma.reaction.count({ where: { estateId, type: 'LIKE' } }),
      this.prisma.reaction.count({ where: { estateId, type: 'DISLIKE' } }),
    ]);
    await this.prisma.estate.update({
      where: { id: estateId },
      data: { likes: likesCount, dislikes: dislikesCount },
    });
    return { likes: likesCount, dislikes: dislikesCount };
  }
}
