import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogService } from '../../books/catalog/catalog.service';
import { Book } from '../../books/entities/book.entity';

@Injectable()
export class ImportIsbnEnrichmentService {
  private readonly logger = new Logger(ImportIsbnEnrichmentService.name);

  constructor(
    private readonly catalog: CatalogService,
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
  ) {}

  async enrichBook(book: Book): Promise<Book> {
    if (book.coverImageUrl && book.genre) {
      return book;
    }

    const isbn = book.isbn13 ?? book.isbn10;
    if (!isbn) {
      return book;
    }

    try {
      const lookup = await this.catalog.lookupByIsbn(isbn);
      if (!lookup) {
        return book;
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
        return this.booksRepo.save(book);
      }
    } catch (err) {
      this.logger.warn(
        `ISBN enrichment failed for book ${book.id}: ${err instanceof Error ? err.message : err}`,
      );
    }

    return book;
  }
}
