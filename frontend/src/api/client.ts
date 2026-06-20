import { ApiRequestError } from './errors';
import type {
  AnnualGoalResponse,
  ApiError,
  Book,
  BookCreatedResponse,
  CatalogEdition,
  CatalogSearchResponse,
  CreateBookPayload,
  EditionCoversResponse,
  MonthlyTbrResponse,
  PatchReadingRecordPayload,
  ReadingRecordPatchedResponse,
  TbrEntry,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

let onUnauthorized: (() => void) | null = null;

/** Clears session and redirects when the API returns 401. Wired from AuthProvider. */
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    if (res.status === 401) {
      onUnauthorized?.();
    }
    throw new ApiRequestError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function devLogin(email: string) {
  return request<{ access_token: string; user: { id: string; email: string } }>(
    '/auth/dev-login',
    { method: 'POST', body: JSON.stringify({ email }) },
  );
}

export async function searchCatalog(
  q: string,
  limit = 20,
): Promise<CatalogSearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return request(`/books/catalog/search?${params}`);
}

export async function fetchEditionCovers(
  dataSource: CatalogEdition['data_source'],
  externalProviderId: string,
  hintCoverUrl?: string | null,
): Promise<EditionCoversResponse> {
  const params = new URLSearchParams({
    data_source: dataSource,
    external_provider_id: externalProviderId,
  });
  if (hintCoverUrl) {
    params.set('hint_cover_url', hintCoverUrl);
  }
  return request(`/books/catalog/covers?${params}`);
}

export async function createBook(
  payload: CreateBookPayload,
): Promise<BookCreatedResponse> {
  return request('/books', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listBooks(): Promise<Book[]> {
  return request('/books');
}

export async function patchReadingRecord(
  bookId: string,
  body: PatchReadingRecordPayload,
): Promise<ReadingRecordPatchedResponse> {
  return request(`/books/${bookId}/reading-record`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function getMonthlyTbr(
  year: number,
  month: number,
): Promise<MonthlyTbrResponse> {
  return request(`/tbr/${year}/${month}`);
}

export async function addTbrEntry(
  year: number,
  month: number,
  bookId: string,
): Promise<TbrEntry> {
  return request(`/tbr/${year}/${month}/entries`, {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  });
}

export async function removeTbrEntry(
  year: number,
  month: number,
  entryId: string,
): Promise<void> {
  return request(`/tbr/${year}/${month}/entries/${entryId}`, {
    method: 'DELETE',
  });
}

export async function getAnnualGoal(year: number): Promise<AnnualGoalResponse> {
  return request(`/goals/${year}`);
}

export async function upsertAnnualGoal(
  year: number,
  targetBookCount: number,
): Promise<AnnualGoalResponse> {
  return request(`/goals/${year}`, {
    method: 'PUT',
    body: JSON.stringify({ target_book_count: targetBookCount }),
  });
}

export function catalogEditionToCreatePayload(
  edition: CatalogEdition,
  coverUrl?: string | null,
): CreateBookPayload {
  return {
    title: edition.title,
    authors: edition.authors,
    isbn_13: edition.isbn_13,
    isbn_10: edition.isbn_10,
    cover_image_url: coverUrl !== undefined ? coverUrl : edition.cover_image_url,
    page_count: edition.page_count,
    genre: edition.genre,
    data_source: edition.data_source,
    external_provider_id: edition.external_provider_id,
  };
}
