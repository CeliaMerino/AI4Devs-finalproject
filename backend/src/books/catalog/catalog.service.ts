import { Injectable, Logger } from '@nestjs/common';
import {
  CatalogEditionDto,
  CatalogSearchResponseDto,
} from '../dto/catalog-edition.dto';
import type { CatalogIsbnLookupResult } from './catalog-isbn-lookup.types';
import { retryWithBackoff } from './retry-with-backoff.util';
import { GoogleBooksClient } from './google-books.client';
import { OpenLibraryClient } from './open-library.client';

const GENRE_LOOKUP_TIMEOUT_MS = 3000;

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
        const items = await Promise.all(
          olItems.map((item) => this.fillGenreFromGoogleBooksIfMissing(item)),
        );
        return { items, source: 'open_library' };
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

  async resolveMissingGenreFromGoogleBooks(
    edition: Pick<
      CatalogEditionDto,
      'genre' | 'isbn_13' | 'isbn_10' | 'data_source'
    >,
  ): Promise<string | null> {
    const enriched = await this.fillGenreFromGoogleBooksIfMissing({
      title: '',
      authors: '',
      cover_image_url: null,
      page_count: null,
      external_provider_id: '',
      ...edition,
    });
    return enriched.genre;
  }

  private async mergeProviderLookups(
    olEdition: CatalogEditionDto | null,
    gbEdition: CatalogEditionDto | null,
  ): Promise<CatalogIsbnLookupResult | null> {
    if (!olEdition && !gbEdition) {
      return null;
    }

    let genre = gbEdition?.genre ?? olEdition?.genre ?? null;
    if (!genre && olEdition) {
      const enriched = await this.fillGenreFromGoogleBooksIfMissing(olEdition);
      genre = enriched.genre;
    }

    return {
      cover_image_url:
        olEdition?.cover_image_url ?? gbEdition?.cover_image_url ?? null,
      genre,
    };
  }

  private async fillGenreFromGoogleBooksIfMissing(
    edition: CatalogEditionDto,
  ): Promise<CatalogEditionDto> {
    if (edition.data_source === 'google_books' || edition.genre) {
      return edition;
    }

    const isbn = edition.isbn_13 ?? edition.isbn_10;
    if (!isbn) {
      return edition;
    }

    const genre = await this.lookupGenreFromGoogleBooks(isbn);
    if (!genre) {
      return edition;
    }

    return { ...edition, genre };
  }

  private async lookupGenreFromGoogleBooks(isbn: string): Promise<string | null> {
    try {
      const lookup = this.googleBooks.lookupGenreByIsbn(isbn);
      const timeout = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), GENRE_LOOKUP_TIMEOUT_MS);
      });
      const genre = await Promise.race([lookup, timeout]);
      return genre ?? null;
    } catch (err) {
      this.logger.warn(
        `Google Books genre lookup failed for ISBN "${isbn}": ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
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
