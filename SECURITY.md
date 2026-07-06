# Security Policy

StadiumPulse AI is a hackathon demonstration project, but it is built with a
security-first posture. This document summarises how the project protects users
and data, and how to report a vulnerability.

## Reporting a vulnerability

If you discover a security issue, please open a private report / issue describing:

- the affected component and version (commit SHA),
- reproduction steps or a proof of concept,
- the potential impact.

Please do **not** open a public issue containing exploit details or any secrets.

## Secrets and keys

- Gemini and all Google **server** API keys are used **only** on the backend and
  are never sent to the browser. The single client-side key is the referrer-
  restricted Maps JavaScript key.
- Secrets are provided via environment variables. `.env` is git-ignored;
  `.env.example` documents configuration without real values.
- No secrets are logged. Errors returned to clients are generic and non-leaking.

## Application hardening

- **HTTP headers:** Helmet with a strict Content-Security-Policy — **no
  `unsafe-inline` or `unsafe-eval`** (the UI ships zero inline styles/scripts),
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` (and HSTS in
  production).
- **CORS:** strict allow-list driven by `CORS_ORIGIN`.
- **Rate limiting:** the assistant endpoint is rate limited (`express-rate-limit`).
- **Body limits:** JSON bodies are capped (oversized payloads are rejected with 413).
- **Input validation & sanitisation:** every form field and API request is
  validated and free text is sanitised.
- **Prompt-injection guard:** user prompts are inspected before any model call.
- **No dangerous DOM:** `dangerouslySetInnerHTML` is not used anywhere.
- **No PII:** only non-sensitive UI preferences are stored, in `localStorage`.

## Dependencies

- Production dependencies are audited in CI (`npm run security:audit`).
- The dependency surface is intentionally small (no heavy UI frameworks).

## Supported versions

The `main` branch is the only supported version for this project.
