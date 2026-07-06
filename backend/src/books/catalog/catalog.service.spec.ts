import { CatalogService } from './catalog.service';
import { CatalogEditionDto } from '../dto/catalog-edition.dto';

describe('CatalogService', () => {
  const olEdition: CatalogEditionDto = {
    title: 'Test',
    authors: 'Author',
    cover_image_url: null,
    page_count: 100,
    genre: 'Fiction',
    isbn_13: null,
    isbn_10: null,
    data_source: 'open_library',
    external_provider_id: '/works/OL1W',
  };

  let openLibrary: { search: jest.Mock };
  let googleBooks: { search: jest.Mock };
  let service: CatalogService;

  beforeEach(() => {
    openLibrary = { search: jest.fn() };
    googleBooks = { search: jest.fn() };
    service = new CatalogService(
      openLibrary as never,
      googleBooks as never,
    );
  });

  it('returns Open Library results without calling Google Books', async () => {
    openLibrary.search.mockResolvedValue([olEdition]);

    const result = await service.search('le guin', 20);

    expect(result.source).toBe('open_library');
    expect(result.items).toHaveLength(1);
    expect(googleBooks.search).not.toHaveBeenCalled();
  });

  it('falls back to Google Books when Open Library is empty', async () => {
    openLibrary.search.mockResolvedValue([]);
    googleBooks.search.mockResolvedValue([
      { ...olEdition, data_source: 'google_books', external_provider_id: 'vol1' },
    ]);

    const result = await service.search('unknown', 20);

    expect(openLibrary.search).toHaveBeenCalledTimes(1);
    expect(googleBooks.search).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('google_books');
    expect(result.items).toHaveLength(1);
  });

  it('falls back to Google Books when Open Library throws', async () => {
    openLibrary.search.mockRejectedValue(new Error('timeout'));
    googleBooks.search.mockResolvedValue([]);

    const result = await service.search('query', 10);

    expect(googleBooks.search).toHaveBeenCalledTimes(1);
    expect(result.source).toBe('none');
    expect(result.items).toEqual([]);
  });

  it('returns empty when both providers return no items', async () => {
    openLibrary.search.mockResolvedValue([]);
    googleBooks.search.mockResolvedValue([]);

    const result = await service.search('nothing', 20);

    expect(result.source).toBe('none');
    expect(result.items).toEqual([]);
  });

  describe('lookupByIsbn', () => {
    it('prefers Open Library cover and uses Google Books genre', async () => {
      openLibrary.search.mockResolvedValue([
        {
          ...olEdition,
          cover_image_url: 'https://covers.openlibrary.org/b/id/1-L.jpg',
        },
      ]);
      googleBooks.search.mockResolvedValue([
        {
          ...olEdition,
          data_source: 'google_books',
          external_provider_id: 'vol1',
          genre: 'Science Fiction',
          cover_image_url: 'https://books.google.com/cover.jpg',
        },
      ]);

      const result = await service.lookupByIsbn('978-0618640157');

      expect(openLibrary.search).toHaveBeenCalledWith('isbn:9780618640157', 1);
      expect(googleBooks.search).toHaveBeenCalledWith('isbn:9780618640157', 1);
      expect(result).toEqual({
        cover_image_url: 'https://covers.openlibrary.org/b/id/1-L.jpg',
        genre: 'Science Fiction',
      });
    });

    it('falls back to Google Books cover when Open Library has none', async () => {
      openLibrary.search.mockResolvedValue([
        { ...olEdition, cover_image_url: null },
      ]);
      googleBooks.search.mockResolvedValue([
        {
          ...olEdition,
          data_source: 'google_books',
          external_provider_id: 'vol1',
          cover_image_url: 'https://books.google.com/cover.jpg',
        },
      ]);

      const result = await service.lookupByIsbn('0618640150');

      expect(result?.cover_image_url).toBe('https://books.google.com/cover.jpg');
    });

    it('returns null when both providers miss', async () => {
      openLibrary.search.mockResolvedValue([]);
      googleBooks.search.mockResolvedValue([]);

      const result = await service.lookupByIsbn('0000000000');

      expect(result).toBeNull();
    });

    it('returns null for blank ISBN', async () => {
      const result = await service.lookupByIsbn('  ');

      expect(result).toBeNull();
      expect(openLibrary.search).not.toHaveBeenCalled();
    });
  });
});
