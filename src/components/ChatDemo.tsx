'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { chatSuggestions, profile } from '@/data/content';

type Msg = { role: 'user' | 'ai'; text: string };

const GREETING: Msg = { role: 'ai', text: `Hi, I'm ${profile.shortName}'s portfolio assistant. Ask me about his projects, stack or availability.` };

export default function ChatDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const twTimer = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  useEffect(() => () => { window.clearInterval(twTimer.current); abort.current?.abort(); }, []);

  const reveal = (full: string) => {
    window.clearInterval(twTimer.current);
    setMsgs((m) => [...m, { role: 'ai', text: '' }]);
    let i = 0;
    twTimer.current = window.setInterval(() => {
      i += 2;
      setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: 'ai', text: full.slice(0, i) }; return c; });
      if (i >= full.length) { window.clearInterval(twTimer.current); setBusy(false); }
    }, 18);
  };

  const ask = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    const history = [...msgsRef.current, { role: 'user' as const, text: t }];
    setMsgs(history);
    setQ('');
    setBusy(true);
    setTyping(true);
    abort.current?.abort();
    abort.current = new AbortController();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abort.current.signal
      });
      const data: { reply?: string } = await res.json();
      setTyping(false);
      reveal(data.reply || 'Sorry, I could not answer that. Try the contact section instead.');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setTyping(false);
      reveal('I could not reach the server just now. Please try again in a moment.');
    }
  };

  const submit = (e: FormEvent) => { e.preventDefault(); void ask(q); };
  const ordered = [...msgs].reverse(); // the log is column-reverse so the newest message stays in view

  return (
    <section id="demo" className="section">
      <div className="demo-wrap">
        <div className="demo-intro">
          <div className="live-pill"><i />Live demo</div>
          <h2 className="sec-title">Try it, don&apos;t<br />just read it</h2>
          <p>An assistant on this page that answers questions about my work. Ask anything, or tap a suggestion.</p>
        </div>
        <div className="gborder">
          <div className="chat-inner">
            <div className="chat-head"><span><i />Ask about {profile.shortName}&apos;s work</span><small>Powered by Claude</small></div>
            <div className="chat-log" role="log" aria-live="polite" aria-label="Conversation">
              {typing && <div className="typing" aria-label="Assistant is typing"><i /><i /><i /></div>}
              {ordered.map((m, i) => <div key={msgs.length - 1 - i} className={`bubble ${m.role}`}>{m.text}</div>)}
            </div>
            <div className="chat-sugg">
              {chatSuggestions.map((s) => <button key={s} className="sugg" onClick={() => void ask(s)} disabled={busy}>{s}</button>)}
            </div>
            <form className="chat-form" onSubmit={submit}>
              <label htmlFor="chat-q" className="sr-only">Your question</label>
              <input id="chat-q" className="chat-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question…" maxLength={500} autoComplete="off" />
              <button className="chat-send" type="submit" disabled={busy || !q.trim()}>Send</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
