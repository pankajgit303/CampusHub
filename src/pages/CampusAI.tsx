import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowUpRight, Send, ShieldCheck } from 'lucide-react';
import { campusAnswer } from '../services/campusAssistant';
import { useAuth } from '../contexts/AuthContext';
import { PageHeading } from '../components/Shared';
import { Button } from '../components/ui/button';
type Message = {
  role: 'user' | 'assistant';
  text: string;
  mode?: string;
  sources?: { label: string; path: string }[];
};
export default function CampusAI() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState((params.get('q') || '').slice(0, 2000));
  const [busy, setBusy] = useState(false);
  async function ask(text: string) {
    if (!text.trim() || busy || !profile) return;
    setQuestion('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const data = await campusAnswer(text, profile);
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: data.answer, mode: data.mode, sources: data.sources },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Unable to answer: ${(e as Error).message}. Please try again.` },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Your campus assistant"
        description="Live campus-data assistance. No external AI service, generated answers, or automatic changes."
      />
      <section className="chat-panel">
        <div className="chat-welcome">
          <span className="ai-mark">
            <Sparkles size={30} />
          </span>
          <h2>What’s on your mind?</h2>
          <p>Find what you need in your authorised campus records.</p>
          <div className="prompt-grid">
            {[
              profile?.role === 'faculty'
                ? 'Which submissions need review?'
                : 'What assignments are due?',
              'Show my class timetable',
              profile?.role === 'student'
                ? 'How much attendance do I have?'
                : 'Show attendance records',
              'What is the latest notice?',
            ].map((q) => (
              <button disabled={busy} key={q} onClick={() => void ask(q)}>
                {q}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((m, i) => (
            <article key={i} className={`chat-message ${m.role}`}>
              <b>{m.role === 'user' ? 'You' : 'Campus AI'}</b>
              <p>{m.text}</p>
              {m.sources?.map((s) => (
                <Link key={s.path} to={s.path}>
                  {s.label}
                  <ArrowUpRight size={13} />
                </Link>
              ))}
              {m.mode === 'lookup' && (
                <small>Live data lookup · open the source to review the records.</small>
              )}
            </article>
          ))}
          {busy && (
            <div className="chat-message assistant">
              <p>Looking through your campus records…</p>
            </div>
          )}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <input
            aria-label="Your question"
            maxLength={2000}
            placeholder="Ask about your campus…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send question"
            disabled={busy || !question.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
        <p className="secure-note">
          <ShieldCheck size={14} />
          Only information you have permission to access. Verify important dates with your college.
        </p>
      </section>
    </>
  );
}
