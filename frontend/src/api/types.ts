export type DataSource =
  | 'open_library'
  | 'google_books'
  | 'goodreads'
  | 'manual';

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
  created_at: string;
  updated_at: string;
  reading_status?: string;
}

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
