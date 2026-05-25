import { ApiRequestError } from './errors';
import type {
  ApiError,
  Book,
  BookCreatedResponse,
  CatalogEdition,
  CatalogSearchResponse,
  CreateBookPayload,
  EditionCoversResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1';

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
