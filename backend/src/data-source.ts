import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Book } from './books/entities/book.entity';
import { ReadingRecord } from './books/entities/reading-record.entity';
import { MonthlyTbrList } from './lists/entities/monthly-tbr-list.entity';
import { TbrEntry } from './lists/entities/tbr-entry.entity';
import { User } from './users/user.entity';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Book, ReadingRecord, MonthlyTbrList, TbrEntry],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
