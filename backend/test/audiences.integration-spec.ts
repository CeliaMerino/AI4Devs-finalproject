import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AudiencesModule } from '../src/audiences/audiences.module';
import { Audience } from '../src/audiences/entities/audience.entity';
import { AuthModule } from '../src/auth/auth.module';
import { Book } from '../src/books/entities/book.entity';
import { ReadingRecord } from '../src/books/entities/reading-record.entity';
import { User } from '../src/users/user.entity';
import { UsersModule } from '../src/users/users.module';

describe('Audiences API (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Book, ReadingRecord, Audience],
          synchronize: true,
        }),
        UsersModule,
        AuthModule,
        AudiencesModule,
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
      .send({ email: 'audiences@example.com' })
      .expect(201);
    token = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/audiences returns seeded defaults for new user', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audiences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveLength(3);
    expect(res.body.map((item: { name: string }) => item.name)).toEqual([
      'Adulto',
      'Infantil',
      'Juvenil',
    ]);
  });

  it('POST /v1/audiences creates a custom audience', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/audiences')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Young Adult' })
      .expect(201);

    expect(res.body.name).toBe('Young Adult');
    expect(res.body.is_default).toBe(false);
  });

  it('POST /v1/audiences rejects duplicate names', async () => {
    await request(app.getHttpServer())
      .post('/v1/audiences')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'adulto' })
      .expect(409);
  });

  it('DELETE /v1/audiences/{id} removes an audience', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/audiences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const target = list.body.find((item: { name: string }) => item.name === 'Young Adult');
    expect(target).toBeDefined();

    await request(app.getHttpServer())
      .delete(`/v1/audiences/${target.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const after = await request(app.getHttpServer())
      .get('/v1/audiences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(after.body.some((item: { id: string }) => item.id === target.id)).toBe(false);
  });
});
