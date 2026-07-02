import type { FormatCountDto, GenreCountDto } from './monthly-stats-response.dto';

export interface YearlyStatsResponseDto {
  year: number;
  books_read: number;
  pages_read: number;
  average_rating: number | null;
  genre_distribution: GenreCountDto[];
  format_distribution: FormatCountDto[];
  predominant_format: string | null;
}
