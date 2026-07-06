import { MAX_MESSAGE_LENGTH } from './constants';
import { sanitizeText } from './validators';

export interface PromptGuardResult {
  safe: boolean;
  sanitized: string;
  flags: string[];
  reason?: string;
}

/**
 * Known prompt-injection / jailbreak signatures. Each entry has a human label
 * so the UI and logs can explain *why* a prompt was blocked without echoing the
 * raw malicious text back.
 */
const INJECTION_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  {
    label: 'instruction-override',
    pattern: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
  },
  { label: 'instruction-override', pattern: /disregard\s+(?:the\s+)?(?:system|previous|above)/i },
  {
    label: 'system-prompt-probe',
    pattern: /(?:reveal|show|print|repeat)\s+(?:your\s+)?(?:system\s+)?prompt/i,
  },
  { label: 'role-hijack', pattern: /you\s+are\s+now\s+(?:a|an|the)?/i },
  { label: 'role-hijack', pattern: /\b(?:system|assistant)\s*:/i },
  { label: 'jailbreak', pattern: /\b(?:developer|dan)\s+mode\b/i },
  { label: 'jailbreak', pattern: /\bjailbreak\b/i },
  { label: 'exfiltration', pattern: /(?:api|secret|access)\s*[- ]?key/i },
  {
    label: 'policy-override',
    pattern: /(?:bypass|override|ignore)\s+(?:safety|guardrails|rules)/i,
  },
];

/**
 * Inspect a user prompt for injection attempts and return a sanitized, safe-to-use
 * version plus a verdict. Empty and oversized inputs are rejected first.
 */
export function inspectPrompt(rawInput: unknown): PromptGuardResult {
  if (typeof rawInput !== 'string') {
    return { safe: false, sanitized: '', flags: ['non-string'], reason: 'Input must be text' };
  }

  const sanitized = sanitizeText(rawInput);

  if (sanitized.length === 0) {
    return { safe: false, sanitized, flags: ['empty'], reason: 'Empty input' };
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    return {
      safe: false,
      sanitized: sanitized.slice(0, MAX_MESSAGE_LENGTH),
      flags: ['too-long'],
      reason: `Input exceeds ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  const flags: string[] = [];
  for (const { label, pattern } of INJECTION_PATTERNS) {
    if (pattern.test(sanitized) && !flags.includes(label)) {
      flags.push(label);
    }
  }

  if (flags.length > 0) {
    return {
      safe: false,
      sanitized,
      flags,
      reason: 'Potential prompt injection detected',
    };
  }

  return { safe: true, sanitized, flags: [] };
}
