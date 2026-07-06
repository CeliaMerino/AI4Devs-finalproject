import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { Book } from '../src/books/entities/book.entity';
import { ReadingRecord } from '../src/books/entities/reading-record.entity';
import { ImportModule } from '../src/import/import.module';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';

const fixturePath = join(
  __dirname,
  'fixtures',
  'goodreads_library_export.csv',
);
const minFixturePath = join(
  __dirname,
  'fixtures',
  'goodreads_library_export.min.csv',
);

describe('Import API (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Book, ReadingRecord],
          synchronize: true,
        }),
        UsersModule,
        AuthModule,
        ImportModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/dev-login')
      .send({ email: 'import@example.com' })
      .expect(201);
    token = (loginRes.body as { access_token: string }).access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('parses Goodreads CSV upload and returns rows for mapping', async () => {
    const csv = readFileSync(fixturePath);

    const res = await request(app.getHttpServer())
      .post('/v1/import/goodreads')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, 'goodreads_library_export.csv')
      .expect(200);

    const body = res.body as {
      rows: Array<{ title: string; isbn13: string | null }>;
      mapped_rows: Array<{
        book: { title: string; isbn13: string | null };
        reading_record: { status: string; finished_on: string | null };
      }>;
      meta: { parsed_rows: number; mapped_rows: number };
    };

    expect(body.meta.parsed_rows).toBe(1167);
    expect(body.meta.mapped_rows).toBe(1167);
    expect(body.rows[0]?.title).toBe('Hacia mareas malditas');
    expect(body.rows[0]?.isbn13).toBe('9788427052918');
    expect(body.mapped_rows[0]?.book.title).toBe('Hacia mareas malditas');
    expect(body.mapped_rows[0]?.book.isbn13).toBe('9788427052918');
    expect(body.mapped_rows[0]?.reading_record.status).toBe('leido');
    expect(body.mapped_rows[0]?.reading_record.finished_on).toBe('2026-04-26');
    expect(body.mapped_rows[0]?.reading_record.started_on).toBeNull();
  });

  it('requires authentication', async () => {
    const csv = readFileSync(minFixturePath);
    await request(app.getHttpServer())
      .post('/v1/import/goodreads')
      .attach('file', csv, 'goodreads_library_export.csv')
      .expect(401);
  });

  it('rejects requests without a file', async () => {
    await request(app.getHttpServer())
      .post('/v1/import/goodreads')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
