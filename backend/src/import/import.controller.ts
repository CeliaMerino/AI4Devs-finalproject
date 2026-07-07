import {
  Controller,
  Get,
  HttpCode,
  Param,
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
  @HttpCode(202)
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

  @Get('jobs/:jobId')
  getImportJob(
    @Req() req: RequestWithUser,
    @Param('jobId') jobId: string,
  ) {
    return this.importService.getImportJob(req.user.userId, jobId);
  }

  @Post('reenrich-pending')
  @HttpCode(200)
  reenrichPending(@Req() req: RequestWithUser) {
    return this.importService.reenrichPendingBooks(req.user.userId);
  }
}
