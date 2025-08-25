import {
  Body,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from './multer.config';
import { CreateUploadsDto } from './dto/create-uploads.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
      }),
    )
    files: Express.Multer.File[],
    @Body() createMediaDto: CreateUploadsDto,
  ) {
    if (!files || files.length === 0) {
      throw new Error('Файлы не загружены');
    }
    return this.uploadsService.handleFileUpload(files, createMediaDto);
  }
}
