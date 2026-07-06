import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { CorsOptions } from 'cors';

/** Strict CORS options for local development: single allowed origin, no creds. */
export function corsOptions(origin: string): CorsOptions {
  return {
    origin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
    maxAge: 600,
  };
}

/**
 * Helmet configuration with a conservative Content-Security-Policy.
 * No 'unsafe-inline' is used: the UI ships zero inline styles/scripts, so styles
 * and scripts are restricted to same-origin. Google Maps/Fonts sources are
 * allow-listed by explicit https origin for live map mode (never by wildcard).
 */
export function helmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://maps.googleapis.com'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://maps.gstatic.com', 'https://maps.googleapis.com'],
        connectSrc: ["'self'", 'https://maps.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  };
}

/** Build the assistant endpoint rate limiter. */
export function createRateLimiter(max: number, windowMs: number): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
  });
}

/** Never leak internal error details or secrets to clients. */
export function safeErrorMessage(): string {
  return 'Internal server error';
}

/** Parse an integer environment variable with a safe fallback. */
export function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
