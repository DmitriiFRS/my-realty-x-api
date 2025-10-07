import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUploadsDto } from './dto/create-uploads.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EntityType } from './enums/entity-type.enum';
import { Media } from '@prisma/client';

@Injectable()
export class UploadsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findEntity(id: number, type: EntityType) {
    switch (type) {
      case EntityType.ESTATE:
        return this.prisma.estate.findUnique({ where: { id } });
      case EntityType.AVATAR:
        return this.prisma.user.findUnique({ where: { id } });
      case EntityType.LEASE_PDF:
        return this.prisma.estate.findUnique({ where: { id } });
      case EntityType.LEASE_PHOTOS:
        return this.prisma.estate.findUnique({ where: { id } });
      default:
        throw new BadRequestException(`Неподдерживаемый тип сущности: ${type}`);
    }
  }

  async handleFileUpload(files: Express.Multer.File[], createUploadsDto: CreateUploadsDto) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Файлы не загружены');
    }
    const { entityId, entityType, captions } = createUploadsDto;

    const entity = await this.findEntity(entityId, entityType);
    if (!entity) {
      throw new NotFoundException(`Сущность '${entityType}' с ID ${entityId} не найдена.`);
    }
    const savedFilesData: Media[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileUrl = await this.saveFile(file); // saveFile теперь работает с буфером
        const caption = captions && captions[i] ? captions[i] : null;

        const media = await this.prisma.media.create({
          data: {
            url: fileUrl,
            caption,
            size: file.size,
            entityId,
            entityType,
          },
        });
        savedFilesData.push(media);
      }
      return savedFilesData;
    } catch (error) {
      const pathsToDelete = savedFilesData.map((media) => media.url);
      await Promise.all(pathsToDelete.map((p) => this.deleteFile(p)));
      throw new BadRequestException(`Не удалось загрузить файлы: ${error.message}`);
    }
  }

  public async saveFile(file: Express.Multer.File): Promise<string> {
    const fileBuffer = file.buffer;
    const uploadDir = './uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, fileBuffer);

    return `/uploads/${filename}`;
  }

  private async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), fileUrl);
      await fs.unlink(fullPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Ошибка при удалении файла ${fileUrl}:`, error);
      }
    }
  }

  public async getMediaById(entityType: EntityType, entityId: number | number[] | undefined) {
    const media = await this.prisma.media.findMany({
      where: {
        entityType,
        entityId: Array.isArray(entityId) ? { in: entityId } : entityId,
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

    return media;
  }

  public async deleteFiles(fileUrls: string[]): Promise<void> {
    await Promise.all(fileUrls.map((url) => this.deleteSingleFile(url)));
  }

  private async deleteSingleFile(fileUrl: string) {
    try {
      const fullPath = path.join(process.cwd(), fileUrl);
      await fs.unlink(fullPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Ошибка при удалении файла ${fileUrl}:`, error);
      }
    }
  }
}
