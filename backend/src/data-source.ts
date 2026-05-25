import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Book } from './books/entities/book.entity';
import { ReadingRecord } from './books/entities/reading-record.entity';
import { User } from './users/user.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Book, ReadingRecord],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
