import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ImportJobRunner } from './import-job.runner';
import { ImportJobService } from './import-job.service';
import type { ImportJobAcceptedResponse } from './import-job.types';
import type { UploadedCsvFile } from './import.types';

const MAX_GOODREADS_CSV_BYTES = 10 * 1024 * 1024;

@Injectable()
export class ImportService {
  constructor(
    private readonly importJobService: ImportJobService,
    private readonly importJobRunner: ImportJobRunner,
  ) {}

  async importGoodreadsUpload(
    userId: string,
    file: UploadedCsvFile | undefined,
  ): Promise<ImportJobAcceptedResponse> {
    const content = this.readGoodreadsUpload(file);
    const accepted = await this.importJobService.createQueuedJob(userId, content);

    if (process.env.IMPORT_JOBS_SYNC === 'true') {
      await this.importJobRunner.runJob(accepted.job_id, userId);
    } else {
      this.importJobRunner.enqueue(accepted.job_id, userId);
    }

    return accepted;
  }

  getImportJob(userId: string, jobId: string) {
    return this.importJobService.getJobForUser(userId, jobId);
  }

  private readGoodreadsUpload(file: UploadedCsvFile | undefined): string {
    if (!file) {
      throw new BadRequestException('CSV file is required (field name: file)');
    }

    if (file.size > MAX_GOODREADS_CSV_BYTES) {
      throw new PayloadTooLargeException('CSV file exceeds 10 MB limit');
    }

    return file.buffer.toString('utf8');
  }
}
