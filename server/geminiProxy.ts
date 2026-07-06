import type { Request, Response } from 'express';
import { inspectPrompt } from '../src/lib/promptGuard';
import { mockTranslate, type FetchLike } from '../src/lib/googleApiAdapters';
import { PERSONA_LABELS } from '../src/lib/constants';
import { validateAssistantBody } from './validators';
import type {
  AccessibilityNeed,
  AssistantRequest,
  AssistantResponse,
  Persona,
  Recommendation,
  RiskLevel,
} from '../src/types';

/** Exact safety-first system prompt required by the challenge. Backend only. */
export const SYSTEM_PROMPT =
  'You are StadiumPulse AI, a safety-first stadium operations and fan experience copilot. ' +
  'Use only provided context. Do not invent official policies, emergency instructions, or medical advice. ' +
  'For emergencies, instruct the user to contact venue staff or local emergency services. ' +
  'Prioritize accessibility, crowd safety, multilingual clarity, and operational usefulness.';

export interface AssistantConfig {
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
}

const PERSONA_ACTION: Record<Persona, string> = {
  fan: 'Follow the recommended low-crowd, accessible route to your destination.',
  organizer: 'Review the dashboard decision cards and approve the highest-priority action.',
  volunteer: 'Head to the flagged zone and assist fans with wayfinding and accessibility.',
  staff: 'Coordinate the operational response and confirm gate and shuttle adjustments.',
};

const RISK_TIME_IMPACT: Record<RiskLevel, number> = {
  low: 2,
  medium: 4,
  high: 7,
  critical: 10,
};

export function riskFromCrowd(summary: string): RiskLevel {
  const s = summary.toLowerCase();
  if (/critical|red/.test(s)) return 'critical';
  if (/congested|orange/.test(s)) return 'high';
  if (/busy|yellow/.test(s)) return 'medium';
  return 'low';
}

export function accessibilityNoteFor(needs: AccessibilityNeed[]): string {
  if (needs.includes('wheelchair') || needs.includes('step-free')) {
    return 'Prioritising step-free, wheelchair-accessible routing with assistance points.';
  }
  if (needs.length > 0) {
    return 'Selected accessibility preferences have been applied to the recommendation.';
  }
  return 'No specific accessibility needs selected.';
}

/** Deterministic, persona-aware recommendation built before any Gemini call. */
export function buildAssistantRecommendation(request: AssistantRequest): Recommendation {
  const { context } = request;
  const risk = riskFromCrowd(context.crowdSummary);
  return {
    summary: `Guidance for ${PERSONA_LABELS[context.persona]} in ${context.zone}.`,
    action: PERSONA_ACTION[context.persona],
    reason: `Current crowd context: ${context.crowdSummary || 'no live signal provided'} (risk: ${risk}).`,
    risk,
    timeImpactMinutes: RISK_TIME_IMPACT[risk],
    accessibilityNote: accessibilityNoteFor(context.accessibility),
    sustainabilityNote: 'Prefer low-carbon transport and water-refill points where possible.',
    simulated: true,
  };
}

export function renderReply(recommendation: Recommendation): string {
  return (
    `${recommendation.summary} Suggested action: ${recommendation.action} ` +
    `Reason: ${recommendation.reason} Risk level: ${recommendation.risk}. ` +
    `Estimated time impact: ${recommendation.timeImpactMinutes} min. ` +
    'Note: live venue data is simulated in demo mode; for emergencies contact venue staff.'
  );
}

interface GeminiResponse {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
}

async function callGemini(
  config: AssistantConfig,
  request: AssistantRequest,
  recommendation: Recommendation,
): Promise<string> {
  const model = config.model ?? 'gemini-1.5-flash';
  const fetchImpl: FetchLike = config.fetchImpl ?? (fetch as unknown as FetchLike);
  const prompt =
    `${SYSTEM_PROMPT}\n\nRespond in language code: ${request.context.language}.\n` +
    `Persona: ${request.context.persona}. Zone: ${request.context.zone}. ` +
    `Crowd: ${request.context.crowdSummary}.\n` +
    `Deterministic recommendation: ${JSON.stringify(recommendation)}\n` +
    `User message: ${request.message}`;
  const res = await fetchImpl(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status}`);
  }
  const data = (await res.json()) as GeminiResponse;
  const candidate = data.candidates[0];
  if (!candidate) throw new Error('Empty Gemini response');
  const part = candidate.content.parts[0];
  if (!part) throw new Error('Empty Gemini content');
  return part.text;
}

/**
 * Express handler for POST /api/assistant.
 * Flow: validate -> prompt-guard -> deterministic recommendation -> optional
 * Gemini summarisation -> multilingual reply. Falls back to mock on any error.
 */
export function createAssistantHandler(config: AssistantConfig = {}) {
  return async (req: Request, res: Response): Promise<void> => {
    const parsed = validateAssistantBody(req.body);
    if (!parsed.valid || parsed.value === null) {
      res.status(400).json({ error: parsed.error });
      return;
    }

    const guard = inspectPrompt(parsed.value.message);
    if (!guard.safe) {
      res.status(400).json({ error: 'Message rejected by safety guard', flags: guard.flags });
      return;
    }

    const recommendation = buildAssistantRecommendation(parsed.value);
    const replyEn = renderReply(recommendation);
    const language = parsed.value.context.language;

    let reply: string;
    let source: 'live' | 'mock';
    if (config.apiKey) {
      try {
        reply = await callGemini(config, parsed.value, recommendation);
        source = 'live';
      } catch {
        reply = mockTranslate(replyEn, language);
        source = 'mock';
      }
    } else {
      reply = mockTranslate(replyEn, language);
      source = 'mock';
    }

    const response: AssistantResponse = { recommendation, reply, language, source };
    res.json(response);
  };
}
