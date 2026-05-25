import { Injectable, Logger } from '@nestjs/common';
import { CatalogSearchResponseDto } from '../dto/catalog-edition.dto';
import { GoogleBooksClient } from './google-books.client';
import { OpenLibraryClient } from './open-library.client';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly openLibrary: OpenLibraryClient,
    private readonly googleBooks: GoogleBooksClient,
  ) {}

  async search(query: string, limit: number): Promise<CatalogSearchResponseDto> {
    try {
      const olItems = await this.openLibrary.search(query, limit);
      if (olItems.length > 0) {
        return { items: olItems, source: 'open_library' };
      }
      this.logger.debug(`Open Library returned 0 hits for "${query}"`);
    } catch (err) {
      this.logger.warn(
        `Open Library failed for "${query}": ${err instanceof Error ? err.message : err}`,
      );
    }

    try {
      const gbItems = await this.googleBooks.search(query, limit);
      if (gbItems.length > 0) {
        return { items: gbItems, source: 'google_books' };
      }
    } catch (err) {
      this.logger.warn(
        `Google Books fallback failed for "${query}": ${err instanceof Error ? err.message : err}`,
      );
    }

    return { items: [], source: 'none' };
  }
}
