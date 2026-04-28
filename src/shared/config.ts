/**
 * App-level configuration sourced from environment variables.
 *
 * Expo exposes any variable prefixed with EXPO_PUBLIC_ at build time via
 * process.env. We do NOT keep production URLs as in-code fallbacks: that
 * would defeat the purpose of having an .env file and risks leaking
 * environment-specific endpoints into the bundle.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill it in, then restart the dev server.`,
    );
  }
  return value.trim();
}

export const API_URL = requireEnv('EXPO_PUBLIC_API_URL');
export const WS_URL = requireEnv('EXPO_PUBLIC_WS_URL');

/** Network timeouts and pagination tunables — kept in one place. */
export const networkConfig = {
  requestTimeoutMs: 15_000,
  feedPageSize: 10,
  commentsPageSize: 20,
  wsReconnectDelayMs: 3_000,
} as const;
