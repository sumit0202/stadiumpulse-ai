import { RiskBadge } from './RiskBadge';
import type { Recommendation } from '../types';

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <article className="rec">
      <h3>{recommendation.summary}</h3>
      <RiskBadge risk={recommendation.risk} />
      <dl>
        <dt>Suggested action</dt>
        <dd>{recommendation.action}</dd>
        <dt>Reason</dt>
        <dd>{recommendation.reason}</dd>
        <dt>Time impact</dt>
        <dd>{recommendation.timeImpactMinutes} min</dd>
        <dt>Accessibility</dt>
        <dd>{recommendation.accessibilityNote}</dd>
        <dt>Sustainability</dt>
        <dd>{recommendation.sustainabilityNote}</dd>
      </dl>
      {recommendation.simulated ? (
        <p className="muted">
          <small>Based on simulated demo data.</small>
        </p>
      ) : null}
    </article>
  );
}
