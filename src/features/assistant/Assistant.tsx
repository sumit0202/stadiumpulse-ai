import { useEffect, useRef, useState } from 'react';
import { requestAssistant } from '../../lib/api';
import { inspectPrompt } from '../../lib/promptGuard';
import { RecommendationCard } from '../../components/RecommendationCard';
import { usePreferences } from '../../state/preferences';
import { mockCrowd } from '../../data/mockCrowd';
import type { AssistantResponse, Recommendation } from '../../types';

interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  lang: string;
}

function buildCrowdSummary(): string {
  const worst = [...mockCrowd.zones].sort((a, b) => b.density - a.density)[0];
  if (!worst) return 'No crowd signal available';
  return `${worst.name} is ${worst.level} at ${worst.density}% density`;
}

export function Assistant() {
  const { preferences } = usePreferences();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  if (!preferences) return null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const guard = inspectPrompt(input);
    if (!guard.safe) {
      setError(`Message blocked: ${guard.reason}`);
      return;
    }
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: guard.sanitized,
      lang: preferences.language,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response: AssistantResponse = await requestAssistant(
        {
          message: guard.sanitized,
          context: {
            persona: preferences.persona,
            language: preferences.language,
            accessibility: preferences.accessibility,
            zone: preferences.zone,
            crowdSummary: buildCrowdSummary(),
          },
        },
        controller.signal,
      );
      setRecommendation(response.recommendation);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: response.reply, lang: response.language },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card stack" aria-labelledby="assistant-title">
      <h2 id="assistant-title">AI Stadium Copilot</h2>
      <p className="muted">
        Context-aware for {preferences.persona} in {preferences.zone}. Replies use your selected
        language and note when data is simulated.
      </p>

      <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
        {messages.length === 0 ? (
          <p className="muted">Ask about routes, crowds, transport, accessibility or safety.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`} lang={m.lang}>
              <span className="live-region">
                {m.role === 'ai' ? 'Assistant said: ' : 'You said: '}
              </span>
              {m.text}
            </div>
          ))
        )}
      </div>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={send} className="toolbar">
        <label htmlFor="assistant-input" className="live-region">
          Ask the StadiumPulse copilot
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          placeholder="e.g. Fastest step-free route to my seat"
          onChange={(e) => setInput(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Thinking…' : 'Send'}
        </button>
      </form>

      {recommendation ? (
        <div>
          <h3>Structured recommendation</h3>
          <RecommendationCard recommendation={recommendation} />
        </div>
      ) : null}
    </section>
  );
}
