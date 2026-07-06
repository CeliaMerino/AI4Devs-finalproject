import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { parseGoodreadsCsv } from './goodreads/goodreads-csv.parser';
import type { GoodreadsParseResult } from './goodreads/goodreads-csv.types';
import type { UploadedCsvFile } from './import.types';

const MAX_GOODREADS_CSV_BYTES = 10 * 1024 * 1024;

@Injectable()
export class ImportService {
  parseGoodreadsUpload(
    file: UploadedCsvFile | undefined,
  ): GoodreadsParseResult {
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
