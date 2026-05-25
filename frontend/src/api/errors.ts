import type { ApiError } from './types';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message?.toString() ?? 'API error');
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export function messageFromApiError(status: number, body: ApiError): string {
  if (status === 409 || body.code === 'BOOK_DUPLICATE') {
    return 'Este libro ya está en tu biblioteca.';
  }
  if (typeof body.message === 'string') {
    return body.message;
  }
  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }
  return 'Ha ocurrido un error. Inténtalo de nuevo.';
}

export function messageFromUnknownError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    return messageFromApiError(err.status, err.body);
  }
  if (err && typeof err === 'object' && 'status' in err && 'body' in err) {
    const { status, body } = err as { status: number; body: ApiError };
    return messageFromApiError(status, body);
  }
  return 'Ha ocurrido un error. Inténtalo de nuevo.';
}
