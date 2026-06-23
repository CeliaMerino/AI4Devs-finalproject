import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/entities/book.entity';
import { ReadingRecord } from '../books/entities/reading-record.entity';
import type {
  FormatCountDto,
  GenreCountDto,
  MonthlyStatsResponseDto,
} from './dto/monthly-stats-response.dto';

const UNKNOWN_BUCKET = 'unknown';

/** Deterministic tie-break order for predominant format. */
const FORMAT_ORDER = ['fisico', 'ebook', 'audio'];

interface AggregateRow {
  booksRead: string | number | null;
  pagesRead: string | number | null;
  avgRating: string | number | null;
}

interface DistributionRow {
  key: string | null;
  count: string | number | null;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(ReadingRecord)
    private readonly readingRepo: Repository<ReadingRecord>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async getMonthlyStats(
    userId: string,
    year: number,
    month: number,
  ): Promise<MonthlyStatsResponseDto> {
    const { monthStart, monthEnd } = StatsService.monthBounds(year, month);

    const totals = await this.readingRepo
      .createQueryBuilder('rr')
      .innerJoin(Book, 'b', 'b.id = rr.bookId')
      .select('COUNT(*)', 'booksRead')
      .addSelect('COALESCE(SUM(b.pageCount), 0)', 'pagesRead')
      .addSelect('AVG(rr.rating)', 'avgRating')
      .where('b.userId = :userId', { userId })
      .andWhere('rr.status = :status', { status: 'leido' })
      .andWhere('rr.finishedOn >= :monthStart', { monthStart })
      .andWhere('rr.finishedOn < :monthEnd', { monthEnd })
      .getRawOne<AggregateRow>();

    const genreDistribution: GenreCountDto[] = (
      await this.distribution(userId, monthStart, monthEnd, 'b.genre')
    ).map(({ label, count }) => ({ genre: label, count }));

    const formatDistribution: FormatCountDto[] = (
      await this.distribution(userId, monthStart, monthEnd, 'rr.readFormat')
    ).map(({ label, count }) => ({ format: label, count }));

    return {
      year,
      month,
      books_read: StatsService.toInt(totals?.booksRead),
      pages_read: StatsService.toInt(totals?.pagesRead),
      average_rating: StatsService.roundAverage(totals?.avgRating),
      genre_distribution: genreDistribution,
      format_distribution: formatDistribution,
      predominant_format:
        StatsService.pickPredominantFormat(formatDistribution),
    };
  }

  private async distribution(
    userId: string,
    monthStart: string,
    monthEnd: string,
    column: string,
  ): Promise<Array<{ label: string; count: number }>> {
    const rows = await this.readingRepo
      .createQueryBuilder('rr')
      .innerJoin(Book, 'b', 'b.id = rr.bookId')
      .select(`COALESCE(${column}, :unknown)`, 'key')
      .addSelect('COUNT(*)', 'count')
      .where('b.userId = :userId', { userId })
      .andWhere('rr.status = :status', { status: 'leido' })
      .andWhere('rr.finishedOn >= :monthStart', { monthStart })
      .andWhere('rr.finishedOn < :monthEnd', { monthEnd })
      .groupBy(`COALESCE(${column}, :unknown)`)
      .orderBy('COUNT(*)', 'DESC')
      .setParameter('unknown', UNKNOWN_BUCKET)
      .getRawMany<DistributionRow>();

    return rows.map((row) => ({
      label: row.key ?? UNKNOWN_BUCKET,
      count: StatsService.toInt(row.count),
    }));
  }

  static monthBounds(
    year: number,
    month: number,
  ): { monthStart: string; monthEnd: string } {
    const mm = String(month).padStart(2, '0');
    const monthStart = `${year}-${mm}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    return { monthStart, monthEnd };
  }

  static validate(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 1970 || year > 2100) {
      throw new BadRequestException('year must be between 1970 and 2100');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('month must be between 1 and 12');
    }
  }

  static toInt(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }

  static roundAverage(
    value: string | number | null | undefined,
  ): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return Math.round(parsed * 100) / 100;
  }

  static pickPredominantFormat(distribution: FormatCountDto[]): string | null {
    const candidates = distribution.filter(
      (entry) => entry.format !== UNKNOWN_BUCKET && entry.count > 0,
    );
    if (candidates.length === 0) {
      return null;
    }
    candidates.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (
        StatsService.formatRank(a.format) - StatsService.formatRank(b.format)
      );
    });
    return candidates[0].format;
  }

  private static formatRank(format: string): number {
    const index = FORMAT_ORDER.indexOf(format);
    return index === -1 ? FORMAT_ORDER.length : index;
  }
}
