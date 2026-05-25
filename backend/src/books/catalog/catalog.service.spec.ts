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
});
