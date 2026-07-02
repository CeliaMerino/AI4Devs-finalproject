export type DataSource =
  | 'open_library'
  | 'google_books'
  | 'goodreads'
  | 'manual';

export type AudienceType = 'young_adult' | 'new_adult' | 'adult';

export type ReadingStatus = 'pendiente' | 'leyendo' | 'leido' | 'dnf';

export type ReadFormat = 'fisico' | 'ebook' | 'audio';

export interface CatalogEdition {
  title: string;
  authors: string;
  cover_image_url: string | null;
  page_count: number | null;
  genre: string | null;
  isbn_13: string | null;
  isbn_10: string | null;
  data_source: 'open_library' | 'google_books';
  external_provider_id: string;
}

export interface CatalogSearchResponse {
  items: CatalogEdition[];
  source: 'open_library' | 'google_books' | 'none';
}

export interface CoverOption {
  id: string;
  url: string;
  label: string | null;
}

export interface EditionCoversResponse {
  covers: CoverOption[];
  default_cover_id: string | null;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  authors: string;
  isbn_13: string | null;
  isbn_10: string | null;
  cover_image_url: string | null;
  page_count: number | null;
  genre: string | null;
  series_name: string | null;
  publication_year: number | null;
  data_source: DataSource;
  external_provider_id: string | null;
  notes: string | null;
  audience: AudienceType | null;
  created_at: string;
  updated_at: string;
  reading_status?: ReadingStatus;
  started_on?: string | null;
  finished_on?: string | null;
  rating?: number | null;
  read_format?: ReadFormat | null;
}

export interface PatchReadingRecordPayload {
  status?: ReadingStatus;
  started_on?: string;
  finished_on?: string;
  rating?: number;
  read_format?: ReadFormat | null;
}

export interface ReadingRecordResource {
  book_id: string;
  status: ReadingStatus;
  current_page: number | null;
  progress_percent: string | null;
  rating: number | null;
  read_format: ReadFormat | null;
  started_on: string | null;
  finished_on: string | null;
  updated_at: string;
}

export interface PatchSideEffectsMeta {
  openCompletionModal?: boolean;
  tbrAutoCompleted?: boolean;
}

export interface ReadingRecordPatchedResponse {
  reading: ReadingRecordResource;
  book: { id: string; page_count: number | null };
  meta?: PatchSideEffectsMeta;
}

export interface MonthlyTbrList {
  id: string;
  year: number;
  month: number;
  auto_created: boolean;
  created_at: string;
  updated_at: string;
}

export interface TbrBookSummary {
  id: string;
  title: string;
  authors: string;
  cover_image_url: string | null;
  reading_status: ReadingStatus;
}

export interface TbrEntry {
  id: string;
  book_id: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  added_at: string;
  book: TbrBookSummary;
}

export interface MonthlyTbrResponse {
  list: MonthlyTbrList;
  entries: TbrEntry[];
}

export type GoalForecastStatus = 'ahead' | 'on_track' | 'behind';

export interface GoalForecast {
  projected_year_end_count: number;
  on_track: boolean;
  pace_books_per_week: number;
  required_books_per_week: number;
  status: GoalForecastStatus;
}

export interface AnnualGoalResource {
  id: string;
  target_book_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnnualGoalResponse {
  year: number;
  goal: AnnualGoalResource | null;
  books_read: number;
  progress_percent: number | null;
  forecast: GoalForecast | null;
}

export interface GenreCount {
  genre: string;
  count: number;
}

export interface FormatCount {
  format: string;
  count: number;
}

export interface AudienceCount {
  audience: string;
  count: number;
}

export interface RatingCount {
  rating: number;
  count: number;
}

export interface MonthlyStatsResponse {
  year: number;
  month: number;
  books_read: number;
  pages_read: number;
  average_rating: number | null;
  genre_distribution: GenreCount[];
  format_distribution: FormatCount[];
  predominant_format: string | null;
  audience_distribution: AudienceCount[];
  rating_distribution: RatingCount[];
}

export interface YearlyStatsResponse {
  year: number;
  books_read: number;
  pages_read: number;
  average_rating: number | null;
  genre_distribution: GenreCount[];
  format_distribution: FormatCount[];
  predominant_format: string | null;
  audience_distribution: AudienceCount[];
  rating_distribution: RatingCount[];
}

export type StatsResponse = MonthlyStatsResponse | YearlyStatsResponse;

export interface CreateBookPayload {
  title: string;
  authors: string;
  isbn_13?: string | null;
  isbn_10?: string | null;
  cover_image_url?: string | null;
  page_count?: number | null;
  genre?: string | null;
  series_name?: string | null;
  publication_year?: number | null;
  data_source: DataSource;
  external_provider_id?: string | null;
  notes?: string | null;
  audience?: AudienceType | null;
}

export interface PatchBookPayload {
  title?: string;
  authors?: string;
  cover_image_url?: string | null;
  page_count?: number | null;
  genre?: string | null;
  series_name?: string | null;
  publication_year?: number | null;
  audience?: AudienceType | null;
  notes?: string | null;
}

export interface BookCreatedResponse {
  book: Book;
  reading: { book_id: string; status: string };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  code?: string;
  existingBookId?: string;
}
