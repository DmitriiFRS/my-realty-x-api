import { BadRequestException, Injectable } from '@nestjs/common';
import { PropertyEntityCreateDto } from '../dto/property-entity-create.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma } from '@prisma/client';
import { TranslationService } from './translation-service';

@Injectable()
export abstract class PropertyEntityService<
  TModel,
  TCreateDto extends PropertyEntityCreateDto,
> {
  constructor(
    readonly prisma: PrismaService,
    readonly modelName: Prisma.ModelName,
    protected readonly translationService: TranslationService,
    protected isTranslatable: boolean = true,
  ) {}

  async findMany(locale: string, include?: any): Promise<TModel[]> {
    try {
      if (this.isTranslatable) {
        const finalInclude = { ...include, translations: true };
        const entities = await this.prisma[this.modelName].findMany({
          include: finalInclude,
        });

        return this.translationService.translateDeep(entities, locale);
      } else {
        return await this.prisma[this.modelName].findMany({
          include: include,
        });
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch ${this.modelName}: ${error.message}`,
      );
    }
  }

  async create(dto: TCreateDto): Promise<TModel[]> {
    if (!dto || !dto.slug || !dto.translations?.length) {
      throw new BadRequestException(
        'Slug and at least one translation are required',
      );
    }

    const defaultTranslation = dto.translations.find((t) => t.locale === 'ru');

    if (!defaultTranslation) {
      throw new BadRequestException(
        'Default translation for "ru" locale is required.',
      );
    }

    try {
      const entity = await this.prisma[this.modelName].create({
        data: {
          slug: dto.slug,
          name: defaultTranslation.name,
          translations: {
            create: dto.translations,
          },
        },
      });
      return entity;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `A ${this.modelName} with this slug already exists.`,
        );
      }
      throw new BadRequestException(
        `Failed to create ${this.modelName}: ${error.message}`,
      );
    }
  }
}
