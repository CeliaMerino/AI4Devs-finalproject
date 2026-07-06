import type { GoodreadsParsedUploadResult } from './goodreads/goodreads-csv.types';
import type {
  GoodreadsImportedRow,
  GoodreadsImportSkippedRow,
  GoodreadsImportSummary,
} from './goodreads/goodreads-import.types';

export interface UploadedCsvFile {
  buffer: Buffer;
  size: number;
  originalname?: string;
  mimetype?: string;
}

export interface GoodreadsImportResult extends GoodreadsParsedUploadResult {
  imported: GoodreadsImportedRow[];
  skipped_rows: GoodreadsImportSkippedRow[];
  meta: GoodreadsParsedUploadResult['meta'] & GoodreadsImportSummary['meta'];
}
