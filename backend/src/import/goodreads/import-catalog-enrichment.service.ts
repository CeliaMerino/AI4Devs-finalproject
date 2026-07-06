import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogService } from '../../books/catalog/catalog.service';
import { Book } from '../../books/entities/book.entity';

export interface ImportEnrichmentResult {
  book: Book;
  enrichment_failed: boolean;
}

@Injectable()
export class ImportCatalogEnrichmentService {
  private readonly logger = new Logger(ImportCatalogEnrichmentService.name);

  constructor(
    private readonly catalog: CatalogService,
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  async enrichBook(book: Book): Promise<ImportEnrichmentResult> {
    if (book.coverImageUrl && book.genre) {
      return { book, enrichment_failed: false };
    }

    const isbn = book.isbn13 ?? book.isbn10;
    let attempted = false;

    try {
      let lookup = null;

      if (isbn) {
        attempted = true;
        lookup = await this.catalog.lookupByIsbn(isbn);
      } else if (book.title.trim() && book.authors.trim()) {
        attempted = true;
        lookup = await this.catalog.lookupByTitleAuthor(
          book.title,
          book.authors,
        );
      }

      if (!lookup) {
        return { book, enrichment_failed: attempted };
      }

      let changed = false;

      if (!book.coverImageUrl && lookup.cover_image_url) {
        book.coverImageUrl = lookup.cover_image_url;
        changed = true;
      }

      if (!book.genre && lookup.genre) {
        book.genre = lookup.genre;
        changed = true;
      }

      if (changed) {
        const saved = await this.booksRepo.save(book);
        return { book: saved, enrichment_failed: false };
      }

      return { book, enrichment_failed: false };
    } catch (err) {
      this.logger.warn(
        `Catalog enrichment failed for book ${book.id}: ${err instanceof Error ? err.message : err}`,
      );
      return { book, enrichment_failed: attempted };
    }
  }
}
