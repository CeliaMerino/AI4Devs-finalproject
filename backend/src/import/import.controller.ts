import {
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/request-with-user';
import { ImportService } from './import.service';
import type { UploadedCsvFile } from './import.types';

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('goodreads')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  parseGoodreadsCsv(
    @Req() req: RequestWithUser,
    @UploadedFile() file: UploadedCsvFile | undefined,
  ) {
    return this.importService.importGoodreadsUpload(req.user.userId, file);
  }
}
