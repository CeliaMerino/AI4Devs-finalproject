import { ImportIsbnEnrichmentService } from './import-isbn-enrichment.service';
import { Book } from '../../books/entities/book.entity';
import { CatalogService } from '../../books/catalog/catalog.service';
import { Repository } from 'typeorm';

describe('ImportIsbnEnrichmentService', () => {
  let catalog: jest.Mocked<Pick<CatalogService, 'lookupByIsbn'>>;
  let booksRepo: jest.Mocked<Pick<Repository<Book>, 'save'>>;
  let service: ImportIsbnEnrichmentService;

  const baseBook = (): Book =>
    ({
      id: 'book-1',
      isbn13: '9780618640157',
      isbn10: '0618640150',
      coverImageUrl: null,
      genre: null,
    }) as Book;

  beforeEach(() => {
    catalog = { lookupByIsbn: jest.fn() };
    booksRepo = { save: jest.fn(async (book) => book) };
    service = new ImportIsbnEnrichmentService(
      catalog as unknown as CatalogService,
      booksRepo as unknown as Repository<Book>,
    );
  });

  it('fills missing cover and genre from catalog', async () => {
    catalog.lookupByIsbn.mockResolvedValue({
      cover_image_url: 'https://covers.openlibrary.org/b/id/1-L.jpg',
      genre: 'Fantasy',
    });

    const result = await service.enrichBook(baseBook());

    expect(catalog.lookupByIsbn).toHaveBeenCalledWith('9780618640157');
    expect(booksRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coverImageUrl: 'https://covers.openlibrary.org/b/id/1-L.jpg',
        genre: 'Fantasy',
      }),
    );
    expect(result.genre).toBe('Fantasy');
  });

  it('skips catalog lookup when book is already complete', async () => {
    const book = {
      ...baseBook(),
      coverImageUrl: 'https://example.com/cover.jpg',
      genre: 'Fantasy',
    } as Book;

    const result = await service.enrichBook(book);

    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
    expect(booksRepo.save).not.toHaveBeenCalled();
    expect(result).toBe(book);
  });

  it('skips when book has no ISBN', async () => {
    const book = {
      ...baseBook(),
      isbn13: null,
      isbn10: null,
    } as Book;

    await service.enrichBook(book);

    expect(catalog.lookupByIsbn).not.toHaveBeenCalled();
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

  it('continues when catalog lookup fails', async () => {
    catalog.lookupByIsbn.mockRejectedValue(new Error('timeout'));

    const book = baseBook();
    const result = await service.enrichBook(book);

    expect(result).toBe(book);
    expect(booksRepo.save).not.toHaveBeenCalled();
  });
});
