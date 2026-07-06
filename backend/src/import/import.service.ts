import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { parseGoodreadsCsv } from './goodreads/goodreads-csv.parser';
import { GoodreadsImportProcessor } from './goodreads/goodreads-import.processor';
import type { GoodreadsImportResult, UploadedCsvFile } from './import.types';

const MAX_GOODREADS_CSV_BYTES = 10 * 1024 * 1024;

@Injectable()
export class ImportService {
  constructor(
    private readonly goodreadsImportProcessor: GoodreadsImportProcessor,
  ) {}

  async importGoodreadsUpload(
    userId: string,
    file: UploadedCsvFile | undefined,
  ): Promise<GoodreadsImportResult> {
    const parsed = this.parseGoodreadsUpload(file);
    const importResult = await this.goodreadsImportProcessor.processImport(
      userId,
      parsed.mapped_rows,
      parsed.mapping_warnings,
    );

    return {
      ...parsed,
      imported: importResult.imported,
      skipped_rows: importResult.skipped_rows,
      enrichment_failed: importResult.enrichment_failed,
      meta: {
        ...parsed.meta,
        ...importResult.meta,
      },
    };
  }

  parseGoodreadsUpload(file: UploadedCsvFile | undefined) {
    if (!file) {
      throw new BadRequestException('CSV file is required (field name: file)');
    }

    if (file.size > MAX_GOODREADS_CSV_BYTES) {
      throw new PayloadTooLargeException('CSV file exceeds 10 MB limit');
    }

    const content = file.buffer.toString('utf8');
    return parseGoodreadsCsv(content);
  }
}
