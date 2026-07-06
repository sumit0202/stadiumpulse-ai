# StadiumPulse AI

A GenAI-powered **stadium command & fan-assistance copilot** for the FIFA World Cup 2026 era.
It helps four personas — **Fan, Organizer, Volunteer, Venue Staff** — make real-time,
safety-first decisions about navigation, crowds, accessibility, transport, sustainability,
multilingual help, incidents and operational intelligence.

> Independent hackathon project for the Hack2Skill Virtual PromptWars Challenge 4.
> Not affiliated with, endorsed by, or using any assets of FIFA. No copyrighted logos or images —
> everything is inline SVG, CSS gradients and typed mock data.

---

## 1. Project title

**StadiumPulse AI** — Smart Stadium Operations + Fan Experience copilot.

## 2. Chosen vertical

**Smart Stadium Operations + Fan Experience.**

## 3. Problem statement

Mega-event venues generate overwhelming, fast-changing signals — gate pressure, crowd density,
transport queues, incidents, weather/air quality, accessibility constraints and a highly
multilingual audience. Fans get lost or stuck; organizers and staff react late; accessibility and
sustainability are afterthoughts. There is no single, calm, safety-first assistant that turns raw
signals into **clear, explainable, multilingual actions** for the right persona at the right time.

## 4. Solution overview

StadiumPulse AI is a fast, accessible web app with:

- A **deterministic decision engine** (`decisionEngine.ts`) that turns venue/crowd/transport data
  into explainable recommendations **before** any AI is involved.
- A **GenAI copilot** (Gemini via a secure backend proxy) that summarises those deterministic
  recommendations and answers persona-aware, multilingual questions — **grounded only in provided
  context** and guarded against prompt injection.
- Purpose-built modules for **navigation, crowd management, accessibility, transport,
  sustainability, incidents** and an **API status** page for easy evaluation.
- A clean **adapter layer** representing **all 8 required Google APIs**, each with a live
  implementation and a typed mock fallback so the whole product works in **demo mode without keys**.

## 5. Personas supported

| Persona     | Focus                                                                 |
| ----------- | --------------------------------------------------------------------- |
| Fan         | Wayfinding, accessible/low-crowd routes, transport, multilingual help |
| Organizer   | KPIs, decision cards, approvals, operational intelligence             |
| Volunteer   | Zone assignments, wayfinding assistance, incident support             |
| Venue Staff | Gate/shuttle actions, crowd buffers, energy/cooling, incidents        |

## 6. GenAI usage

- **Where:** backend `POST /api/assistant` proxy only. The Gemini key is **never** exposed to the
  browser.
- **How:** the deterministic engine builds a structured recommendation first; Gemini then
  summarises/answers in the user's language. On any AI failure the app **degrades gracefully** to
  the deterministic + mock reply.
- **Safety:** a fixed system prompt (safety-first, context-only, no invented policies/medical
  advice, emergencies → contact venue staff/emergency services) plus a **prompt-injection guard**
  (`promptGuard.ts`).
- **Structured output:** every recommendation returns Summary, Suggested action, Reason, Risk
  level (Low/Medium/High/Critical), Estimated time impact, Accessibility note and Sustainability
  note, and flags when data is simulated.

## 7. The 8 Google APIs and their roles

All are integrated through the typed adapter layer in `src/lib/googleApiAdapters.ts`. Each adapter
has a TypeScript interface, a **live implementation**, a **mock fallback**, input validation, typed
output, safe error handling and unit tests.

| #   | API                        | Role in StadiumPulse AI                                                           | Scope                       |
| --- | -------------------------- | --------------------------------------------------------------------------------- | --------------------------- |
| 1   | **Gemini / Generative AI** | Copilot, operational summarisation, multilingual reasoning, recommendations       | Backend only                |
| 2   | **Maps JavaScript API**    | Interactive stadium map: gates, zones, amenities, crowd overlays                  | Frontend (browser key only) |
| 3   | **Places API**             | Nearby entrances, transit, hospitals, parking, restrooms, food, help desks, water | Backend                     |
| 4   | **Routes API**             | Accessible / low-crowd / evacuation routing + route matrix comparison             | Backend                     |
| 5   | **Geocoding API**          | Address ↔ coordinate conversion and reverse geocoding of user location            | Backend                     |
| 6   | **Cloud Translation API**  | Translate assistant replies and critical operational alerts                       | Backend                     |
| 7   | **Time Zone API**          | Venue-local match schedules, volunteer shifts, alerts, transport timing           | Backend                     |
| 8   | **Air Quality API**        | Heat/pollution-aware health, sustainability & accessibility advice                | Backend                     |

## 8. Demo mode explanation

- **No keys required.** With an empty `.env` (or none), every adapter returns typed **mock**
  responses and the backend answers with the deterministic engine. The evaluator can exercise the
  **entire product** — chat, dashboard, routing, crowd, accessibility, transport, sustainability,
  incidents and the API status page — without any Google keys.
- **Live mode.** Provide keys in `.env` and adapters switch to live implementations
  (server-side keys stay on the server; only the Maps browser key is used client-side).
- The **API status** page shows each API as `Demo mode`, `Ready for live key`, `Live connected` or
  `Error`.

## 9. Architecture

```
src/
  components/     Reusable, accessible UI (Header, Logo, StatusChip, RiskBadge, KpiCard, RecommendationCard)
  features/       assistant, dashboard, navigation, crowd, accessibility, transport,
                  sustainability, incidents, api-status, onboarding
  lib/            googleApiAdapters, decisionEngine, promptGuard, validators, cache,
                  sustainability, constants, api (backend client)
  data/           mockVenue, mockCrowd, mockTransport, mockIncidents  (typed, fictional)
  state/          PreferencesProvider (localStorage, a11y settings)
  types/          Shared domain types
  tests/          Real unit / component / a11y / backend tests
server/
  index.ts        Express app: Helmet, strict CORS, JSON limit, rate limiting, routes
  geminiProxy.ts  Assistant handler: validate → guard → deterministic → optional Gemini → translate
  security.ts     CORS/Helmet config, rate limiter, safe errors, env parsing
  validators.ts   Server-side request validation & sanitisation
scripts/
  checkRepoSize.js  Fails if committed files exceed the 10 MB budget
```

**Flow:** UI → deterministic engine (instant, explainable) → backend proxy → Gemini (optional
summary) → translated, structured recommendation → accessible UI.

## 10. How to run locally

```bash
npm install
npm run dev
```

- Web app: <http://localhost:5173>
- Backend proxy: <http://localhost:8787>
- `npm run dev` starts both (Vite + the Express proxy) via `concurrently`.

Runs fully in **demo mode** with no configuration. Build for production with `npm run build` and
preview with `npm run preview` (run `npm run start:api` for the proxy).

## 11. Environment variables

Copy `.env.example` → `.env` (never commit `.env`). All are optional; absence ⇒ demo mode.

| Variable                                  | Scope    | Purpose                                                                |
| ----------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `GEMINI_API_KEY`                          | Backend  | Enables live Gemini                                                    |
| `GEMINI_MODEL`                            | Backend  | Gemini model (default `gemini-2.0-flash`)                              |
| `GOOGLE_SERVER_API_KEY`                   | Backend  | Server key for Places/Routes/Geocoding/Translation/TimeZone/AirQuality |
| `PORT`                                    | Backend  | Proxy port (default 8787)                                              |
| `CORS_ORIGIN`                             | Backend  | Allowed origin (default `http://localhost:5173`)                       |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Backend  | Assistant rate limit                                                   |
| `VITE_GOOGLE_MAPS_BROWSER_KEY`            | Frontend | **Only** browser-exposed key (referrer-restricted)                     |
| `VITE_API_BASE_URL`                       | Frontend | Backend base URL (default `/api`)                                      |

## 12. Testing commands

```bash
npm run test           # run all tests once
npm run test:coverage  # enforce 100% branches/functions/lines/statements on core layers
npm run test:a11y      # accessibility (axe) tests
```

Test types included: decision engine, prompt guard, validators, all 8 adapters, sustainability
scoring, crowd recommendations, accessibility components, backend assistant endpoint (Supertest),
API status, form validation, error states, keyboard interaction, and malicious/empty/oversized/
unsupported-language inputs, plus positive/negative/null/undefined and boundary cases, backend
security integration (rate limit 429, Helmet CSP, strict CORS, oversized-body rejection) and
keyboard/skip-link/toggle accessibility tests. **190 tests; 100% coverage** on the enforced layers
(`src/lib`, `src/data`, `server/{geminiProxy,security,validators}`). Every push and PR runs the full
suite (lint, format, type-check, coverage, build, size guard, dependency audit) in GitHub Actions CI.

## 13. Security practices

- Gemini/Cloud secrets are **backend-only**; only the Maps browser key is client-side.
- `.env` git-ignored; `.env.example` documents config safely.
- Input validation + text sanitisation on **every** form and API endpoint.
- **No** `dangerouslySetInnerHTML` anywhere.
- Prompt-injection guard (`promptGuard.ts`) with tests for malicious/empty/oversized/unsupported
  input.
- Backend: **Helmet** security headers + CSP, **strict CORS**, JSON body size limit, **rate
  limiting** on the assistant endpoint, safe generic error messages, no secret logging.
- **No PII** collected; only non-sensitive preferences stored in `localStorage`.

## 14. Accessibility practices

- Semantic HTML with landmarks (`header`, `main`, `section`, `footer`), skip-to-content link,
  `tabIndex` main target.
- Primary views use the **WAI-ARIA tabs pattern** (`tablist`/`tab`/`tabpanel`) with **roving
  tabindex** and Arrow/Home/End key navigation.
- ARIA labels, `role="alert"`/`role="status"`/`role="log"` live regions for alerts and results.
- Multilingual assistant replies carry a `lang` attribute so screen readers pronounce them
  correctly.
- Full keyboard operability and visible focus states (`:focus-visible`).
- **High-contrast**, **large-text** and **reduced-motion** toggles (persisted), plus
  `prefers-reduced-motion` support.
- **No colour-only communication** — every status/risk/crowd level is also labelled in text.
- Responsive mobile/desktop layout. Automated `axe` tests on core screens.

## 15. Efficiency practices

- Map component is **lazy-loaded** (separate chunk) via `React.lazy`/`Suspense`.
- Assistant calls use **AbortController** cancellation.
- Search input is **debounced** (`useDebouncedValue`) to avoid work on every keystroke.
- Short-TTL adapter response **cache** (`cache.ts`).
- Pure functions for scoring/decisions; `useMemo` for expensive derivations.
- No heavy UI libraries; production bundle ≈ 59 KB gzipped. `check:size` keeps the repo < 10 MB.

## 16. Assumptions

- Venue, crowd, transport and incident data are **fictional and simulated** for the demo.
- Coordinates and AQI are illustrative; live values arrive via the adapters when keys are present.
- "Real-time" is simulated from typed snapshots; the architecture supports live streams unchanged.
- The strict 100% coverage threshold is enforced on the deterministic, security and adapter layers
  where it is meaningful; UI components are still tested (RTL + axe) but not gated at 100%.

## 17. Challenge scoring alignment

- **Code Quality** — TypeScript strict mode, ESLint (incl. `jsx-a11y`), Prettier, small pure
  modules, typed adapter layer, zero `any`, clean separation of concerns, and GitHub Actions CI
  gating lint/format/type-check/coverage/build/size/audit.
- **Security** — backend-only secrets, Helmet + CSP, strict CORS, rate limiting, validation +
  sanitisation everywhere, prompt-injection guard, no PII, no `dangerouslySetInnerHTML`.
- **Efficiency** — lazy loading, debounce/AbortController, TTL cache, memoized pure logic, tiny
  bundle, repo-size guard.
- **Testing** — 190 real tests, **100%** branches/functions/lines/statements on core layers,
  including positive/negative/null/undefined/boundary cases, backend security integration
  (Supertest) and accessibility (axe); enforced in CI on every push/PR.
- **Accessibility** — semantic landmarks, WAI-ARIA tabs (roving tabindex + arrow keys), ARIA,
  keyboard support, contrast/motion/text toggles, no colour-only cues, `lang`-tagged multilingual
  replies, axe tests.

## 18. Repository rules

- **Public** GitHub-ready repository, single **`main`** branch assumption.
- **< 10 MB** tracked size (enforced by `npm run check:size`; currently ~0.5 MB).
- **No secrets committed** — strict `.gitignore` blocks `.env`, `node_modules`, `dist`, `coverage`
  and binary/media assets.
- No official FIFA branding or copyrighted assets — inline SVG, CSS gradients and mock data only.

## Deployment (Docker / Google Cloud Run)

The repo ships a `Dockerfile` that builds the SPA and serves it from the same Express
process that exposes `/api`, so the whole app runs as a **single container / single service**.

```bash
# build & run locally
docker build -t stadiumpulse-ai .
docker run -p 8080:8080 -e PORT=8080 stadiumpulse-ai

# deploy to Google Cloud Run (demo mode; add keys to go live)
gcloud run deploy stadiumpulse-ai --source . --region <region> --allow-unauthenticated

# live mode: attach the Gemini key (server-side env only)
gcloud run deploy stadiumpulse-ai --source . --region <region> --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY=<key>,GEMINI_MODEL=gemini-2.0-flash
```

Cloud Run sets `PORT` automatically; the server reads it. The Gemini key stays in the
service's environment and is never exposed to the browser. Without a key the service runs
fully in demo mode.

## Package scripts

| Script           | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `dev`            | Run web + backend proxy together             |
| `build`          | Type-check and build the production bundle   |
| `preview`        | Preview the production build                 |
| `lint`           | ESLint with zero warnings allowed            |
| `format`         | Prettier write                               |
| `test`           | Run all tests                                |
| `test:coverage`  | Tests with enforced 100% coverage thresholds |
| `test:a11y`      | Accessibility tests                          |
| `check:size`     | Fail if committed files exceed 10 MB         |
| `security:audit` | `npm audit` on production dependencies       |

## License

MIT — see headers/usage; provided for hackathon evaluation.
