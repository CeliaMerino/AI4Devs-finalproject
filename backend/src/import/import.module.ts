import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../books/books.module';
import { Book } from '../books/entities/book.entity';
import { ReadingRecord } from '../books/entities/reading-record.entity';
import { GoodreadsImportProcessor } from './goodreads/goodreads-import.processor';
import { ImportCatalogEnrichmentService } from './goodreads/import-catalog-enrichment.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, ReadingRecord]),
    BooksModule,
  ],
  controllers: [ImportController],
  providers: [
    ImportService,
    GoodreadsImportProcessor,
    ImportCatalogEnrichmentService,
  ],
  exports: [ImportService],
})
export class ImportModule {}
