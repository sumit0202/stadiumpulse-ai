import {
  isLanguage,
  isPersona,
  sanitizeText,
  validateAccessibilityNeeds,
  validateMessage,
} from '../src/lib/validators';
import type { AssistantRequest } from '../src/types';

export interface ServerValidationResult<T> {
  valid: boolean;
  value: T | null;
  error?: string;
}

function invalid<T>(error: string): ServerValidationResult<T> {
  return { valid: false, value: null, error };
}

/**
 * Validate and normalise the assistant request body received by the backend.
 * Every field is checked and all free text is sanitized. No PII is accepted or
 * required.
 */
export function validateAssistantBody(body: unknown): ServerValidationResult<AssistantRequest> {
  if (typeof body !== 'object' || body === null) {
    return invalid('Request body must be an object');
  }
  const root = body as Record<string, unknown>;

  const message = validateMessage(root.message);
  if (!message.valid || message.value === null) {
    return { valid: false, value: null, error: message.error };
  }

  const rawContext = root.context;
  if (typeof rawContext !== 'object' || rawContext === null) {
    return invalid('Context is required');
  }
  const context = rawContext as Record<string, unknown>;

  if (!isPersona(context.persona)) {
    return invalid('Invalid persona');
  }
  if (!isLanguage(context.language)) {
    return invalid('Unsupported language');
  }

  const accessibility = validateAccessibilityNeeds(context.accessibility ?? []);
  const zoneRaw = typeof context.zone === 'string' ? sanitizeText(context.zone) : '';
  const zone = zoneRaw.length > 0 ? zoneRaw.slice(0, 60) : 'general';
  const crowdSummaryRaw =
    typeof context.crowdSummary === 'string' ? sanitizeText(context.crowdSummary) : '';
  const crowdSummary = crowdSummaryRaw.slice(0, 240);

  return {
    valid: true,
    value: {
      message: message.value,
      context: {
        persona: context.persona,
        language: context.language,
        accessibility: accessibility.value ?? [],
        zone,
        crowdSummary,
      },
    },
  };
}
