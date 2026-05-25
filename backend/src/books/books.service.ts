import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookCreatedResponseDto,
  BookDto,
  BookListItemDto,
} from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { GoogleBooksClient } from './catalog/google-books.client';
import { OpenLibraryEnrichmentService } from './catalog/open-library-enrichment.service';
import { Book } from './entities/book.entity';
import { ReadingRecord } from './entities/reading-record.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    @InjectRepository(ReadingRecord)
    private readonly readingRepo: Repository<ReadingRecord>,
    private readonly openLibraryEnrichment: OpenLibraryEnrichmentService,
    private readonly googleBooksClient: GoogleBooksClient,
  ) {}

  async listForUser(userId: string): Promise<BookListItemDto[]> {
    const books = await this.booksRepo.find({
      where: { userId },
      relations: ['readingRecord'],
      order: { createdAt: 'DESC' },
    });
    return books.map((b) => ({
      ...this.toBookDto(b),
      reading_status: b.readingRecord?.status ?? 'pendiente',
    }));
  }

  async create(userId: string, dto: CreateBookDto): Promise<BookCreatedResponseDto> {
    await this.assertNotDuplicate(userId, dto);
    const metadata = await this.resolveMetadata(dto);

    const book = this.booksRepo.create({
      userId,
      title: dto.title,
      authors: dto.authors,
      isbn13: dto.isbn_13 ?? null,
      isbn10: dto.isbn_10 ?? null,
      coverImageUrl: dto.cover_image_url ?? null,
      pageCount: metadata.page_count,
      genre: metadata.genre,
      seriesName: dto.series_name ?? null,
      publicationYear: dto.publication_year ?? null,
      dataSource: dto.data_source,
      externalProviderId: dto.external_provider_id ?? null,
      notes: dto.notes ?? null,
    });

    const saved = await this.booksRepo.save(book);

    const reading = this.readingRepo.create({
      bookId: saved.id,
      status: 'pendiente',
    });
    await this.readingRepo.save(reading);

    return {
      book: this.toBookDto(saved),
      reading: { book_id: saved.id, status: 'pendiente' },
    };
  }

  private async resolveMetadata(
    dto: CreateBookDto,
  ): Promise<{ genre: string | null; page_count: number | null }> {
    let genre = dto.genre ?? null;
    let page_count = dto.page_count ?? null;

    if (genre && page_count) {
      return { genre, page_count };
    }

    if (dto.data_source === 'open_library' && dto.external_provider_id) {
      const enriched = await this.openLibraryEnrichment.enrichEdition({
        title: dto.title,
        authors: dto.authors,
        cover_image_url: dto.cover_image_url ?? null,
        page_count,
        genre,
        isbn_13: dto.isbn_13 ?? null,
        isbn_10: dto.isbn_10 ?? null,
        data_source: 'open_library',
        external_provider_id: dto.external_provider_id,
      });
      genre = genre ?? enriched.genre;
      page_count = page_count ?? enriched.page_count;
    }

    if (
      dto.data_source === 'google_books' &&
      dto.external_provider_id &&
      (!genre || !page_count)
    ) {
      const volume = await this.googleBooksClient.getVolumeDetails(
        dto.external_provider_id,
      );
      if (volume) {
        genre = genre ?? volume.genre;
        page_count = page_count ?? volume.page_count;
      }
    }

    return { genre, page_count };
  }

  private async assertNotDuplicate(
    userId: string,
    dto: CreateBookDto,
  ): Promise<void> {
    if (dto.isbn_13) {
      const byIsbn = await this.booksRepo.findOne({
        where: { userId, isbn13: dto.isbn_13 },
      });
      if (byIsbn) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Book already exists in your library',
          code: 'BOOK_DUPLICATE',
          existingBookId: byIsbn.id,
        });
      }
    }

    if (dto.data_source && dto.external_provider_id) {
      const byExternal = await this.booksRepo.findOne({
        where: {
          userId,
          dataSource: dto.data_source,
          externalProviderId: dto.external_provider_id,
        },
      });
      if (byExternal) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Book already exists in your library',
          code: 'BOOK_DUPLICATE',
          existingBookId: byExternal.id,
        });
      }
    }
  }

  async findOneForUser(userId: string, bookId: string): Promise<Book> {
    const book = await this.booksRepo.findOne({
      where: { id: bookId, userId },
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  toBookDto(book: Book): BookDto {
    return {
      id: book.id,
      user_id: book.userId,
      title: book.title,
      authors: book.authors,
      isbn_13: book.isbn13,
      isbn_10: book.isbn10,
      cover_image_url: book.coverImageUrl,
      page_count: book.pageCount,
      genre: book.genre,
      series_name: book.seriesName,
      publication_year: book.publicationYear,
      data_source: book.dataSource,
      external_provider_id: book.externalProviderId,
      notes: book.notes,
      created_at: book.createdAt.toISOString(),
      updated_at: book.updatedAt.toISOString(),
    };
  }
}
