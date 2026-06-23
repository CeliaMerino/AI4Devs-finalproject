export interface GenreCountDto {
  genre: string;
  count: number;
}

export interface FormatCountDto {
  format: string;
  count: number;
}

export interface MonthlyStatsResponseDto {
  year: number;
  month: number;
  books_read: number;
  pages_read: number;
  average_rating: number | null;
  genre_distribution: GenreCountDto[];
  format_distribution: FormatCountDto[];
  predominant_format: string | null;
}
