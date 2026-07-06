import type { DataSourceType } from '../../books/entities/book.entity';
import type { ReadingStatus } from '../../books/entities/reading-record.entity';

export interface GoodreadsImportBookDraft {
  title: string;
  authors: string;
  isbn10: string | null;
  isbn13: string | null;
  page_count: number | null;
  publication_year: number | null;
  data_source: DataSourceType;
  external_provider_id: string | null;
}

export interface GoodreadsImportReadingRecordDraft {
  status: ReadingStatus;
  rating: number | null;
  read_format: 'fisico' | 'ebook' | 'audio' | null;
  started_on: string | null;
  finished_on: string | null;
}

export interface GoodreadsMappedRow {
  row_number: number;
  book: GoodreadsImportBookDraft;
  reading_record: GoodreadsImportReadingRecordDraft;
}

export interface GoodreadsMappingWarning {
  row_number: number;
  code: string;
  message: string;
}

export interface GoodreadsMappingResult {
  mapped_rows: GoodreadsMappedRow[];
  mapping_warnings: GoodreadsMappingWarning[];
}
