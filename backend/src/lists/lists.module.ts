import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/entities/book.entity';
import { TbrAutoCreateJob } from './jobs/tbr-auto-create.job';
import { MonthlyTbrList } from './entities/monthly-tbr-list.entity';
import { TbrEntry } from './entities/tbr-entry.entity';
import { TbrController } from './tbr.controller';
import { TbrService } from './tbr.service';

@Module({
  imports: [TypeOrmModule.forFeature([MonthlyTbrList, TbrEntry, Book])],
  controllers: [TbrController],
  providers: [TbrService, TbrAutoCreateJob],
  exports: [TbrService],
})
export class ListsModule {}
