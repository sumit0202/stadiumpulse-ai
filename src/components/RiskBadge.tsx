import { RISK_LABELS } from '../lib/constants';
import type { RiskLevel } from '../types';

/** Text-first risk indicator (never colour-only). */
export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span className="risk" data-risk={risk}>
      Risk: {RISK_LABELS[risk]}
    </span>
  );
}
