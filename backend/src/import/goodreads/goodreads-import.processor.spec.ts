import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { ReadingRecord } from '../../books/entities/reading-record.entity';
import { GoodreadsImportProcessor } from './goodreads-import.processor';
import { ImportIsbnEnrichmentService } from './import-isbn-enrichment.service';
import type { GoodreadsMappedRow } from './goodreads-import.types';

describe('GoodreadsImportProcessor', () => {
  let processor: GoodreadsImportProcessor;
  let booksRepo: jest.Mocked<Pick<Repository<Book>, 'find' | 'create' | 'save'>>;
  let readingRepo: jest.Mocked<Pick<Repository<ReadingRecord>, 'create' | 'save'>>;
  let isbnEnrichment: jest.Mocked<Pick<ImportIsbnEnrichmentService, 'enrichBook'>>;

  const sampleRow: GoodreadsMappedRow = {
    row_number: 2,
    book: {
      title: 'The Hobbit',
      authors: 'J.R.R. Tolkien',
      isbn10: '0618640150',
      isbn13: '9780618640157',
      page_count: 320,
      publication_year: 1937,
      data_source: 'goodreads',
      external_provider_id: '1001',
    },
    reading_record: {
      status: 'leido',
      rating: 5,
      read_format: 'fisico',
      started_on: '2024-01-10',
      finished_on: '2024-06-15',
    },
  };

  beforeEach(async () => {
    booksRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value as Book),
      save: jest.fn(async (value) => ({ ...value, id: 'book-1' }) as Book),
    };
    readingRepo = {
      create: jest.fn((value) => value as ReadingRecord),
      save: jest.fn(async (value) => value as ReadingRecord),
    };
    isbnEnrichment = {
      enrichBook: jest.fn(async (book) => book),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoodreadsImportProcessor,
        { provide: getRepositoryToken(Book), useValue: booksRepo },
        { provide: getRepositoryToken(ReadingRecord), useValue: readingRepo },
        { provide: ImportIsbnEnrichmentService, useValue: isbnEnrichment },
      ],
    }).compile();

    processor = moduleRef.get(GoodreadsImportProcessor);
  });

  it('imports a new mapped row', async () => {
    const result = await processor.processImport('user-1', [sampleRow], []);

    expect(result.meta.imported_count).toBe(1);
    expect(result.imported[0]).toEqual({ row_number: 2, book_id: 'book-1' });
    expect(readingRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'leido',
        currentPage: 320,
        progressPercent: '100.00',
      }),
    );
    expect(isbnEnrichment.enrichBook).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'book-1' }),
    );
  });

  it('skips rows that already exist in the library', async () => {
    booksRepo.find.mockResolvedValue([
      {
        id: 'existing-1',
        isbn13: '9780618640157',
        title: 'The Hobbit',
        authors: 'J.R.R. Tolkien',
      } as Book,
    ]);

    const result = await processor.processImport('user-1', [sampleRow], []);

    expect(result.meta.imported_count).toBe(0);
    expect(result.meta.skipped_duplicate_count).toBe(1);
    expect(result.skipped_rows[0]).toMatchObject({
      code: 'DUPLICATE_EXISTING',
      existing_book_id: 'existing-1',
    });
    expect(booksRepo.save).not.toHaveBeenCalled();
  });

  it('skips duplicate rows within the same batch', async () => {
    const duplicateRow: GoodreadsMappedRow = {
      ...sampleRow,
      row_number: 3,
    };

    const result = await processor.processImport(
      'user-1',
      [sampleRow, duplicateRow],
      [],
    );

    expect(result.meta.imported_count).toBe(1);
    expect(result.meta.skipped_duplicate_count).toBe(1);
    expect(result.skipped_rows).toContainEqual(
      expect.objectContaining({
        row_number: 3,
        code: 'DUPLICATE_IN_BATCH',
      }),
    );
  });

  it('records mapping warnings as skipped invalid rows', async () => {
    const result = await processor.processImport('user-1', [], [
      {
        row_number: 4,
        code: 'MISSING_TITLE',
        message: 'Row omitted from mapped_rows because title is empty',
      },
    ]);

    expect(result.meta.skipped_invalid_count).toBe(1);
    expect(result.skipped_rows[0]?.code).toBe('MISSING_TITLE');
  });
});
