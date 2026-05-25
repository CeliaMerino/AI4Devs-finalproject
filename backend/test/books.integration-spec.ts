import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/auth/auth.module';
import { BooksModule } from '../src/books/books.module';
import { Book } from '../src/books/entities/book.entity';
import { ReadingRecord } from '../src/books/entities/reading-record.entity';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('Books API (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
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
        BooksModule,
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
  });
});
