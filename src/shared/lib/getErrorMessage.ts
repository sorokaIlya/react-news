import { ApiError } from '@/transport/api';

/**
 * Extracts a human-readable message from an unknown error value.
 * Use this instead of `catch (e: any)` — narrowing keeps strict typing.
 */
export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}
