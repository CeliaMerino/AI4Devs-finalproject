import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { ReadingRecord } from '../../books/entities/reading-record.entity';
import {
  buildGoodreadsDedupKey,
  buildGoodreadsDedupKeyFromLibraryBook,
} from './goodreads-dedup.util';
import { ImportIsbnEnrichmentService } from './import-isbn-enrichment.service';
import type {
  GoodreadsImportSkippedRow,
  GoodreadsImportSummary,
  GoodreadsMappedRow,
  GoodreadsMappingWarning,
} from './goodreads-import.types';

@Injectable()
export class GoodreadsImportProcessor {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    @InjectRepository(ReadingRecord)
    private readonly readingRepo: Repository<ReadingRecord>,
    private readonly isbnEnrichment: ImportIsbnEnrichmentService,
  ) {}

  async processImport(
    userId: string,
    mappedRows: GoodreadsMappedRow[],
    mappingWarnings: GoodreadsMappingWarning[],
  ): Promise<GoodreadsImportSummary> {
    const existingByKey = await this.loadExistingDedupIndex(userId);
    const batchKeys = new Set<string>();
    const imported: GoodreadsImportSummary['imported'] = [];
    const skipped_rows: GoodreadsImportSkippedRow[] = mappingWarnings.map(
      (warning) => ({
        row_number: warning.row_number,
        code: warning.code,
        message: warning.message,
      }),
    );

    let skipped_duplicate_count = 0;
    const skipped_invalid_count = mappingWarnings.length;

    for (const row of mappedRows) {
      const dedupKey = buildGoodreadsDedupKey(row.book);
      if (batchKeys.has(dedupKey)) {
        skipped_rows.push({
          row_number: row.row_number,
          code: 'DUPLICATE_IN_BATCH',
          message: 'Duplicate row in the same CSV upload',
        });
        skipped_duplicate_count += 1;
        continue;
      }

      const existingBookId = existingByKey.get(dedupKey);

      if (existingBookId) {
        skipped_rows.push({
          row_number: row.row_number,
          code: 'DUPLICATE_EXISTING',
          message: 'Book already exists in library',
          existing_book_id: existingBookId,
        });
        skipped_duplicate_count += 1;
        continue;
      }

      const savedBook = await this.persistRow(userId, row);
      await this.isbnEnrichment.enrichBook(savedBook);
      batchKeys.add(dedupKey);
      imported.push({ row_number: row.row_number, book_id: savedBook.id });
    }

    return {
      imported,
      skipped_rows,
      meta: {
        imported_count: imported.length,
        skipped_duplicate_count,
        skipped_invalid_count,
      },
    };
  }

  private async loadExistingDedupIndex(
    userId: string,
  ): Promise<Map<string, string>> {
    const books = await this.booksRepo.find({
      where: { userId },
      select: ['id', 'isbn13', 'title', 'authors'],
    });

    const index = new Map<string, string>();
    for (const book of books) {
      index.set(buildGoodreadsDedupKeyFromLibraryBook(book), book.id);
    }
    return index;
  }

  private async persistRow(
    userId: string,
    row: GoodreadsMappedRow,
  ): Promise<Book> {
    const { book: bookDraft, reading_record: readingDraft } = row;

    const book = this.booksRepo.create({
      userId,
      title: bookDraft.title,
      authors: bookDraft.authors,
      isbn13: bookDraft.isbn13,
      isbn10: bookDraft.isbn10,
      pageCount: bookDraft.page_count,
      publicationYear: bookDraft.publication_year,
      dataSource: bookDraft.data_source,
      externalProviderId: bookDraft.external_provider_id,
      coverImageUrl: null,
      genre: null,
      seriesName: null,
      notes: null,
      audience: null,
    });

    const savedBook = await this.booksRepo.save(book);
    const isFinished = readingDraft.status === 'leido';
    const pageCount = bookDraft.page_count;

    const reading = this.readingRepo.create({
      bookId: savedBook.id,
      status: readingDraft.status,
      rating:
        readingDraft.rating === null ? null : String(readingDraft.rating),
      readFormat: readingDraft.read_format,
      startedOn: readingDraft.started_on,
      finishedOn: readingDraft.finished_on,
      currentPage: isFinished && pageCount != null ? pageCount : null,
      progressPercent: isFinished && pageCount != null ? '100.00' : null,
    });

    await this.readingRepo.save(reading);
    return savedBook;
  }
}
