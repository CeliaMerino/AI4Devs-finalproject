import { ImportCatalogEnrichmentService } from './import-catalog-enrichment.service';
import { Book } from '../../books/entities/book.entity';
import { CatalogService } from '../../books/catalog/catalog.service';
import { Repository } from 'typeorm';

describe('ImportCatalogEnrichmentService', () => {
  let catalog: jest.Mocked<
    Pick<CatalogService, 'lookupByIsbn' | 'lookupByTitleAuthor'>
  >;
  let booksRepo: jest.Mocked<Pick<Repository<Book>, 'save'>>;
  let service: ImportCatalogEnrichmentService;

  const baseBook = (): Book =>
    ({
      id: 'book-1',
      title: 'The Hobbit',
      authors: 'J.R.R. Tolkien',
      isbn13: '9780618640157',
      isbn10: '0618640150',
      coverImageUrl: null,
      genre: null,
      audience: null,
    }) as Book;

  beforeEach(() => {
    catalog = {
      lookupByIsbn: jest.fn(),
      lookupByTitleAuthor: jest.fn(),
    };
    booksRepo = { save: jest.fn(async (book) => book) };
    service = new ImportCatalogEnrichmentService(
      catalog as unknown as CatalogService,
      booksRepo as unknown as Repository<Book>,
    );
  });

  it('fills missing cover and genre from ISBN catalog lookup', async () => {
    catalog.lookupByIsbn.mockResolvedValue({
      cover_image_url: 'https://covers.openlibrary.org/b/id/1-L.jpg',
      genre: 'Fantasy',
    });

    const result = await service.enrichBook(baseBook());

    expect(catalog.lookupByIsbn).toHaveBeenCalledWith('9780618640157');
    expect(catalog.lookupByTitleAuthor).not.toHaveBeenCalled();
    expect(booksRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageUrl: 'https://covers.openlibrary.org/b/id/1-L.jpg',
        genre: 'Fantasy',
      }),
    );
    expect(result.enrichment_failed).toBe(false);
    expect(result.book.genre).toBe('Fantasy');
  });

  it('uses title+author lookup when no ISBN is present', async () => {
    catalog.lookupByTitleAuthor.mockResolvedValue({
      cover_image_url: 'https://covers.openlibrary.org/b/id/2-L.jpg',
      genre: 'Fiction',
    });

    const book = {
      ...baseBook(),
      isbn13: null,
      isbn10: null,
    } as Book;

    const result = await service.enrichBook(book);

    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
    expect(catalog.lookupByTitleAuthor).toHaveBeenCalledWith(
      'The Hobbit',
      'J.R.R. Tolkien',
    );
    expect(result.enrichment_failed).toBe(false);
    expect(result.book.coverImageUrl).toBe(
      'https://covers.openlibrary.org/b/id/2-L.jpg',
    );
  });

  it('skips catalog lookup when book is already complete', async () => {
    const book = {
      ...baseBook(),
      coverImageUrl: 'https://example.com/cover.jpg',
      genre: 'Fantasy',
    } as Book;

    const result = await service.enrichBook(book);

    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
    expect(catalog.lookupByTitleAuthor).not.toHaveBeenCalled();
    expect(booksRepo.save).not.toHaveBeenCalled();
    expect(result).toEqual({ book, enrichment_failed: false });
  });

  it('does not overwrite existing cover or genre', async () => {
    catalog.lookupByIsbn.mockResolvedValue({
      cover_image_url: 'https://new-cover.jpg',
      genre: 'New Genre',
    });

    const book = {
      ...baseBook(),
      coverImageUrl: 'https://existing-cover.jpg',
    } as Book;

    await service.enrichBook(book);

    expect(booksRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageUrl: 'https://existing-cover.jpg',
        genre: 'New Genre',
      }),
    );
  });

  it('marks enrichment_failed when catalog returns no metadata', async () => {
    catalog.lookupByTitleAuthor.mockResolvedValue(null);

    const book = {
      ...baseBook(),
      isbn13: null,
      isbn10: null,
    } as Book;

    const result = await service.enrichBook(book);

    expect(result.enrichment_failed).toBe(true);
    expect(booksRepo.save).not.toHaveBeenCalled();
  });

  it('continues when catalog lookup throws', async () => {
    catalog.lookupByIsbn.mockRejectedValue(new Error('timeout'));

    const book = baseBook();
    const result = await service.enrichBook(book);

    expect(result.book).toBe(book);
    expect(result.enrichment_failed).toBe(true);
    expect(booksRepo.save).not.toHaveBeenCalled();
  });
});
