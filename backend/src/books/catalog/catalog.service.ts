import { Injectable, Logger } from '@nestjs/common';
import {
  CatalogEditionDto,
  CatalogSearchResponseDto,
} from '../dto/catalog-edition.dto';
import type { CatalogIsbnLookupResult } from './catalog-isbn-lookup.types';
import { retryWithBackoff } from './retry-with-backoff.util';
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

  async lookupByIsbn(isbn: string): Promise<CatalogIsbnLookupResult | null> {
    const normalized = isbn.replace(/-/g, '').trim();
    if (!normalized) {
      return null;
    }

    const query = `isbn:${normalized}`;
    const [olEdition, gbEdition] = await Promise.all([
      this.searchProvider(this.openLibrary, query),
      this.searchProvider(this.googleBooks, query),
    ]);

    if (!olEdition && !gbEdition) {
      return null;
    }

    return this.mergeProviderLookups(olEdition, gbEdition);
  }

  async lookupByTitleAuthor(
    title: string,
    authors: string,
  ): Promise<CatalogIsbnLookupResult | null> {
    const trimmedTitle = title.trim();
    const trimmedAuthors = authors.trim();
    if (!trimmedTitle || !trimmedAuthors) {
      return null;
    }

    const query = `${trimmedTitle} ${trimmedAuthors}`;
    const [olEdition, gbEdition] = await Promise.all([
      this.searchProvider(this.openLibrary, query),
      this.searchProvider(this.googleBooks, query),
    ]);

    return this.mergeProviderLookups(olEdition, gbEdition);
  }

  private mergeProviderLookups(
    olEdition: CatalogEditionDto | null,
    gbEdition: CatalogEditionDto | null,
  ): CatalogIsbnLookupResult | null {
    if (!olEdition && !gbEdition) {
      return null;
    }

    return {
      cover_image_url:
        olEdition?.cover_image_url ?? gbEdition?.cover_image_url ?? null,
      genre: gbEdition?.genre ?? null,
    };
  }

  private async searchProvider(
    provider: { search: (query: string, limit: number) => Promise<CatalogEditionDto[]> },
    query: string,
  ): Promise<CatalogEditionDto | null> {
    try {
      const items = await retryWithBackoff(
        () => provider.search(query, 1),
        { maxAttempts: 3, baseDelayMs: 200 },
      );
      return items[0] ?? null;
    } catch (err) {
      this.logger.warn(
        `Catalog provider failed for "${query}": ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }
}
