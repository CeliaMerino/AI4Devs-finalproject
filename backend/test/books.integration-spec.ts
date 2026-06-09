import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { BooksModule } from '../src/books/books.module';
import { Book } from '../src/books/entities/book.entity';
import { ReadingRecord } from '../src/books/entities/reading-record.entity';
import { ListsModule } from '../src/lists/lists.module';
import { MonthlyTbrList } from '../src/lists/entities/monthly-tbr-list.entity';
import { TbrEntry } from '../src/lists/entities/tbr-entry.entity';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('Books API (integration)', () => {
  let app: INestApplication<App>;
  let token: string;
  let otherToken: string;
  let bookId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Book, ReadingRecord, MonthlyTbrList, TbrEntry],
          synchronize: true,
        }),
        UsersModule,
        AuthModule,
        BooksModule,
        ListsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/v1/auth/dev-login')
      .send({ email: 'test@example.com' })
      .expect(201);

    token = login.body.access_token;

    const otherLogin = await request(app.getHttpServer())
      .post('/v1/auth/dev-login')
      .send({ email: 'other@example.com' })
      .expect(201);

    otherToken = otherLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/books creates book and pendiente reading record', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'The Left Hand of Darkness',
        authors: 'Ursula K. Le Guin',
        data_source: 'open_library',
        external_provider_id: 'OL82563W',
        page_count: 304,
        genre: 'Science fiction',
      })
      .expect(201);

    expect(res.body.book.title).toBe('The Left Hand of Darkness');
    expect(res.body.reading.status).toBe('pendiente');
    expect(res.body.reading.book_id).toBe(res.body.book.id);
    bookId = res.body.book.id;
  });

  it('GET /v1/books includes reading metadata fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const item = res.body.find((b: { id: string }) => b.id === bookId);
    expect(item).toBeDefined();
    expect(item.reading_status).toBe('pendiente');
    expect(item).toHaveProperty('started_on');
    expect(item).toHaveProperty('finished_on');
    expect(item).toHaveProperty('rating');
    expect(item).toHaveProperty('read_format');
  });

  it('PATCH pendiente→leyendo sets started_on', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'leyendo' })
      .expect(200);

    expect(res.body.reading.status).toBe('leyendo');
    expect(res.body.reading.started_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.meta?.openCompletionModal).toBeUndefined();
  });

  it('PATCH leyendo→leido returns openCompletionModal and finished_on', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'leido' })
      .expect(200);

    expect(res.body.reading.status).toBe('leido');
    expect(res.body.reading.finished_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.reading.current_page).toBe(304);
    expect(res.body.meta.openCompletionModal).toBe(true);
  });

  it('PATCH rejects finish date before start date', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        started_on: '2026-05-20',
        finished_on: '2026-05-01',
      })
      .expect(422);

    expect(res.body.code).toBe('FINISHED_BEFORE_STARTED');
  });

  it('PATCH returns 404 for book owned by another user', async () => {
    await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ status: 'leyendo' })
      .expect(404);
  });

  it('PATCH leido without TBR entry omits tbrAutoCompleted', async () => {
    const fresh = await request(app.getHttpServer())
      .post('/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Neuromancer',
        authors: 'William Gibson',
        data_source: 'manual',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/v1/books/${fresh.body.book.id}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'leido' })
      .expect(200);

    expect(res.body.meta?.tbrAutoCompleted).toBeUndefined();
  });

  it('PATCH leido with book in current-month TBR sets tbrAutoCompleted', async () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'pendiente' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/v1/tbr/${year}/${month}/entries`)
      .set('Authorization', `Bearer ${token}`)
      .send({ book_id: bookId })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/v1/books/${bookId}/reading-record`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'leido' })
      .expect(200);

    expect(res.body.meta.tbrAutoCompleted).toBe(true);

    const tbr = await request(app.getHttpServer())
      .get(`/v1/tbr/${year}/${month}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const entry = tbr.body.entries.find(
      (e: { book_id: string }) => e.book_id === bookId,
    );
    expect(entry?.completed).toBe(true);
  });
});
