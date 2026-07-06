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
 * Google Maps script/style/connect sources are allowed so live map mode works.
 */
export function helmetOptions() {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://maps.googleapis.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://maps.gstatic.com', 'https://maps.googleapis.com'],
        connectSrc: ["'self'", 'https://maps.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
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
