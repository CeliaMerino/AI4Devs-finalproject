import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { BooksModule } from '../src/books/books.module';
import { Book } from '../src/books/entities/book.entity';
import { ReadingRecord } from '../src/books/entities/reading-record.entity';
import { GoalsModule } from '../src/goals/goals.module';
import { AnnualReadingGoal } from '../src/goals/entities/annual-reading-goal.entity';
import { ListsModule } from '../src/lists/lists.module';
import { MonthlyTbrList } from '../src/lists/entities/monthly-tbr-list.entity';
import { TbrEntry } from '../src/lists/entities/tbr-entry.entity';
import { StatsModule } from '../src/stats/stats.module';
import type { MonthlyStatsResponseDto } from '../src/stats/dto/monthly-stats-response.dto';
import type { YearlyStatsResponseDto } from '../src/stats/dto/yearly-stats-response.dto';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';

interface SeedBook {
  title: string;
  genre?: string | null;
  pageCount?: number | null;
  status?: 'leido' | 'leyendo';
  startedOn?: string;
  finishedOn?: string;
  rating?: number;
  readFormat?: 'fisico' | 'ebook' | 'audio';
}

describe('Stats API (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  async function login(email: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/dev-login')
      .send({ email })
      .expect(201);
    return (res.body as { access_token: string }).access_token;
  }

  async function seedBook(authToken: string, book: SeedBook): Promise<void> {
    const createRes = await request(app.getHttpServer())
      .post('/v1/books')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: book.title,
        authors: 'Test Author',
        data_source: 'manual',
        genre: book.genre ?? null,
        page_count: book.pageCount ?? null,
      })
      .expect(201);
    const bookId = (createRes.body as { book: { id: string } }).book.id;

    const status = book.status ?? 'leido';
    const patch: Record<string, unknown> = {
      status,
      started_on: book.startedOn ?? '2025-01-01',
    };
    if (status === 'leido') {
      patch.finished_on = book.finishedOn ?? '2025-06-10';
    }
    if (book.rating !== undefined) {
      patch.rating = book.rating;
    }
    if (book.readFormat !== undefined) {
      patch.read_format = book.readFormat;
    }

    await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(patch)
      .expect(200);
  }

  function getStats(authToken: string, year: number, month: number) {
    return request(app.getHttpServer())
      .get(`/v1/stats/${year}/${month}`)
      .set('Authorization', `Bearer ${authToken}`);
  }

  function getYearStats(authToken: string, year: number) {
    return request(app.getHttpServer())
      .get('/v1/stats')
      .query({ period: 'year', year })
      .set('Authorization', `Bearer ${authToken}`);
  }

  async function fetchStats(
    authToken: string,
    year: number,
    month: number,
  ): Promise<MonthlyStatsResponseDto> {
    const res = await getStats(authToken, year, month).expect(200);
    return res.body as MonthlyStatsResponseDto;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User,
            Book,
            ReadingRecord,
            AnnualReadingGoal,
            MonthlyTbrList,
            TbrEntry,
          ],
          synchronize: true,
        }),
        UsersModule,
        AuthModule,
        BooksModule,
        ListsModule,
        GoalsModule,
        StatsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    token = await login('stats@example.com');

    await seedBook(token, {
      title: 'Fantasy A',
      genre: 'Fantasy',
      pageCount: 300,
      finishedOn: '2025-06-10',
      rating: 5,
      readFormat: 'fisico',
    });
    await seedBook(token, {
      title: 'Fantasy B',
      genre: 'Fantasy',
      pageCount: 320,
      finishedOn: '2025-06-20',
      rating: 4,
      readFormat: 'fisico',
    });
    await seedBook(token, {
      title: 'Sci-Fi C',
      genre: 'Sci-Fi',
      pageCount: 400,
      finishedOn: '2025-06-15',
      readFormat: 'ebook',
    });
    await seedBook(token, {
      title: 'No genre D',
      genre: null,
      pageCount: null,
      finishedOn: '2025-06-05',
      rating: 3,
    });
    // Boundary + exclusion books for user A
    await seedBook(token, {
      title: 'Prev month last day',
      genre: 'Fantasy',
      pageCount: 100,
      finishedOn: '2025-05-31',
      readFormat: 'fisico',
    });
    await seedBook(token, {
      title: 'Next month first day',
      genre: 'Fantasy',
      pageCount: 100,
      finishedOn: '2025-07-01',
      readFormat: 'fisico',
    });
    await seedBook(token, {
      title: 'Still reading',
      genre: 'Fantasy',
      pageCount: 999,
      status: 'leyendo',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('aggregates books and pages read for the month (US-05 scenario 1)', async () => {
    const body = await fetchStats(token, 2025, 6);
    expect(body.year).toBe(2025);
    expect(body.month).toBe(6);
    expect(body.books_read).toBe(4);
    // 300 + 320 + 400 + 0 (null page count) = 1020
    expect(body.pages_read).toBe(1020);
  });

  it('averages rating over rated books only', async () => {
    const body = await fetchStats(token, 2025, 6);
    // (5 + 4 + 3) / 3 = 4
    expect(body.average_rating).toBe(4);
  });

  it('averages half-star ratings correctly', async () => {
    const halfStar = await request(app.getHttpServer())
      .post('/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Half Star A',
        authors: 'Author',
        data_source: 'manual',
        page_count: 200,
        genre: 'Fantasy',
      })
      .expect(201);

    const halfStarId = halfStar.body.book.id;
    await request(app.getHttpServer())
      .patch(`/v1/books/${halfStarId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'leido',
        finished_on: '2023-03-15',
        rating: 3.5,
      })
      .expect(200);

    const wholeStar = await request(app.getHttpServer())
      .post('/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Whole Star B',
        authors: 'Author',
        data_source: 'manual',
        page_count: 100,
        genre: 'Fantasy',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/v1/books/${wholeStar.body.book.id}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'leido',
        finished_on: '2023-03-20',
        rating: 4,
      })
      .expect(200);

    const body = await fetchStats(token, 2023, 3);
    expect(body.average_rating).toBe(3.75);
  });

  it('returns genre distribution with null bucketed as unknown, ordered by count desc (US-05 scenario 2)', async () => {
    const body = await fetchStats(token, 2025, 6);
    expect(body.genre_distribution[0]).toEqual({
      genre: 'Fantasy',
      count: 2,
    });
    const byGenre = Object.fromEntries(
      body.genre_distribution.map((g) => [g.genre, g.count]),
    );
    expect(byGenre).toEqual({ Fantasy: 2, 'Sci-Fi': 1, unknown: 1 });
  });

  it('returns format distribution and predominant format', async () => {
    const body = await fetchStats(token, 2025, 6);
    const byFormat = Object.fromEntries(
      body.format_distribution.map((f) => [f.format, f.count]),
    );
    expect(byFormat).toEqual({ fisico: 2, ebook: 1, unknown: 1 });
    expect(body.predominant_format).toBe('fisico');
  });

  it('excludes books finished on the last day of the previous month', async () => {
    const body = await fetchStats(token, 2025, 5);
    expect(body.books_read).toBe(1);
  });

  it('excludes books finished on the first day of the next month', async () => {
    const body = await fetchStats(token, 2025, 7);
    expect(body.books_read).toBe(1);
  });

  it('returns a zeroed payload for an empty month', async () => {
    const body = await fetchStats(token, 2025, 2);
    expect(body).toMatchObject({
      books_read: 0,
      pages_read: 0,
      average_rating: null,
      predominant_format: null,
      genre_distribution: [],
      format_distribution: [],
    });
  });

  it('isolates statistics per user', async () => {
    const otherToken = await login('stats-other@example.com');
    await seedBook(otherToken, {
      title: 'Other user book',
      genre: 'Mystery',
      pageCount: 111,
      finishedOn: '2025-06-12',
      rating: 2,
      readFormat: 'audio',
    });

    const otherBody = await fetchStats(otherToken, 2025, 6);
    expect(otherBody.books_read).toBe(1);
    expect(otherBody.pages_read).toBe(111);

    const mineBody = await fetchStats(token, 2025, 6);
    expect(mineBody.books_read).toBe(4);
  });

  it('rejects an invalid month', async () => {
    await getStats(token, 2025, 13).expect(400);
  });

  it('rejects an invalid year', async () => {
    await getStats(token, 1800, 6).expect(400);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/v1/stats/2025/6').expect(401);
  });

  it('aggregates books and pages read for the full year', async () => {
    const res = await getYearStats(token, 2025).expect(200);
    const body = res.body as YearlyStatsResponseDto;
    expect(body.year).toBe(2025);
    // June (4) + May boundary (1) + July boundary (1) = 6 books in 2025
    expect(body.books_read).toBe(6);
    expect(body.pages_read).toBe(1220);
  });

  it('returns a zeroed payload for an empty year', async () => {
    const res = await getYearStats(token, 2024).expect(200);
    expect(res.body).toMatchObject({
      year: 2024,
      books_read: 0,
      pages_read: 0,
      average_rating: null,
      predominant_format: null,
      genre_distribution: [],
      format_distribution: [],
    });
  });

  it('rejects year query without authentication', async () => {
    await request(app.getHttpServer())
      .get('/v1/stats')
      .query({ period: 'year', year: 2025 })
      .expect(401);
  });

  it('rejects invalid year in query endpoint', async () => {
    await getYearStats(token, 1800).expect(400);
  });
});
