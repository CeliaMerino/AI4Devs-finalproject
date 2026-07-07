import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import { Book } from '../books/entities/book.entity';
import { ReadingRecord } from '../books/entities/reading-record.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ReadingRecord, Audience])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
