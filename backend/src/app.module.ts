import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { Book } from './books/entities/book.entity';
import { ReadingRecord } from './books/entities/reading-record.entity';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Book, ReadingRecord],
        migrations: [`${__dirname}/migrations/*{.ts,.js}`],
        migrationsRun: config.get('TYPEORM_MIGRATIONS_RUN') === 'true',
        synchronize: config.get('TYPEORM_SYNCHRONIZE') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    BooksModule,
  ],
})
export class AppModule {}
