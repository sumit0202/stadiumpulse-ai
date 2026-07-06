import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  corsOptions,
  createRateLimiter,
  helmetOptions,
  parseIntEnv,
  safeErrorMessage,
} from './security';
import { createAssistantHandler } from './geminiProxy';
import { API_INFO, API_NAMES } from '../src/lib/constants';
import type { ApiMode } from '../src/types';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet(helmetOptions()));
  app.use(cors(corsOptions(process.env.CORS_ORIGIN ?? 'http://localhost:5173')));
  app.use(express.json({ limit: '16kb' }));

  const rateMax = parseIntEnv(process.env.RATE_LIMIT_MAX, 30);
  const rateWindow = parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 60_000);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', mode: process.env.GEMINI_API_KEY ? 'live' : 'demo' });
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    const hasServerKey = Boolean(process.env.GOOGLE_SERVER_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);
    const hasMaps = Boolean(process.env.VITE_GOOGLE_MAPS_BROWSER_KEY);
    const statuses = API_NAMES.map((name) => {
      const meta = API_INFO[name];
      let mode: ApiMode = 'demo';
      if (name === 'gemini') mode = hasGemini ? 'live' : 'ready';
      else if (name === 'maps') mode = hasMaps ? 'live' : 'ready';
      else mode = hasServerKey ? 'live' : 'ready';
      return { name, label: meta.label, purpose: meta.purpose, scope: meta.scope, mode };
    });
    res.json({ statuses });
  });

  app.post(
    '/api/assistant',
    createRateLimiter(rateMax, rateWindow),
    createAssistantHandler({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL }),
  );

  // Serve the built SPA (and client-side routes) when a production build exists.
  const clientDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  if (existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
      typeof (err as { status?: number })?.status === 'number'
        ? (err as { status: number }).status
        : 500;
    res.status(status).json({ error: safeErrorMessage() });
  });

  return app;
}

const isDirectRun = process.argv[1] ? import.meta.url === `file://${process.argv[1]}` : false;
if (isDirectRun) {
  const port = parseIntEnv(process.env.PORT, 8787);
  createApp().listen(port, () => {
    // eslint-disable-next-line no-console
    console.warn(`StadiumPulse AI proxy listening on http://localhost:${port}`);
  });
}
