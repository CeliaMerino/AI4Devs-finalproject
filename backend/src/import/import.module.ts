import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { ReadingRecord } from '../books/entities/reading-record.entity';
import { GoodreadsImportProcessor } from './goodreads/goodreads-import.processor';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ReadingRecord])],
  controllers: [ImportController],
  providers: [ImportService, GoodreadsImportProcessor],
  exports: [ImportService],
})
export class ImportModule {}
