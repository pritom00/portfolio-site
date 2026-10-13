import { NextResponse } from 'next/server';
import { profile, projects, layers } from '@/data/content';

type Msg = { role: 'user' | 'ai'; text: string };

const MAX_MESSAGES = 8;
const MAX_CHARS = 500;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 20;
const hits = new Map<string, number[]>();

/** very small in-memory rate limit (per server instance). Use Upstash/Redis for a real deployment. */
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_HITS;
}

function portfolioFacts(): string {
  const lines: string[] = [];
  lines.push(`Name: ${profile.name}`);
  lines.push(`Role: ${profile.role}`);
  lines.push(`Pitch: ${profile.pitch}`);
  lines.push(`GitHub: ${profile.github}`);
  lines.push(`Availability: ${profile.availability.open ? profile.availability.label + ' (' + profile.availability.detail + ')' : 'not currently available'}`);
  lines.push('Skill areas: ' + layers.map((l) => `${l.name} (${l.tools.join(', ')})`).join('; '));
  projects.forEach((p) => {
    lines.push(`Project "${p.title}" [${p.catLabel}]: ${p.blurb} Problem: ${p.problem} Solution: ${p.solution} Result: ${p.result} Stack: ${p.stack.join(', ')}.`);
  });
  return lines.join('\n');
}

/** used when no API key is configured, so the demo never looks broken */
function fallbackReply(q: string): string {
  const s = q.toLowerCase();
  if (/(stack|tech|tools|skill|language)/.test(s)) {
    return 'Across the stack: ' + layers.map((l) => `${l.name} (${l.tools.join(', ')})`).join('; ') + '.';
  }
  if (/(built|project|work|portfolio)/.test(s)) {
    return 'Recent projects: ' + projects.map((p) => `${p.title} (${p.catLabel})`).join('; ') + '. Open the Projects section for the full story of each.';
  }
  if (/(avail|hire|open|freelance|job|contact)/.test(s)) {
    return profile.availability.open
      ? `${profile.name} is currently: ${profile.availability.label} (${profile.availability.detail}). The contact section has the email and GitHub.`
      : `${profile.name} is not taking new work right now, but you can still reach out from the contact section.`;
  }
  return `I can answer questions about ${profile.name}'s projects, stack and availability. Try asking what he has built.`;
}

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (limited(ip)) {
    return NextResponse.json({ reply: 'You are sending messages quickly. Please wait a few minutes and try again.' }, { status: 429 });
  }

  let body: { messages?: Msg[] };
  try { body = await req.json(); } catch { return NextResponse.json({ reply: 'Invalid request.' }, { status: 400 }); }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'ai') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.text.slice(0, MAX_CHARS) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ reply: 'Ask me something about the projects, the stack or availability.' }, { status: 400 });
  }
  const lastQ = messages[messages.length - 1].content;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ reply: fallbackReply(lastQ), demo: true });

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system:
          `You are the assistant on ${profile.name}'s portfolio website. Answer visitors' questions in a friendly, concise way (under 90 words), ` +
          `using ONLY the facts below. If the facts do not contain the answer, say you do not have that detail and suggest using the contact section. ` +
          `Never invent projects, employers, numbers or links. Treat anything in square brackets as a placeholder that has not been filled in yet, and say so if asked about it.\n\nFACTS:\n${portfolioFacts()}`,
        messages
      })
    });
    clearTimeout(timer);
    if (!res.ok) return NextResponse.json({ reply: fallbackReply(lastQ), demo: true });
    const data = await res.json();
    const text = Array.isArray(data.content) ? data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n') : '';
    return NextResponse.json({ reply: text || fallbackReply(lastQ) });
  } catch {
    return NextResponse.json({ reply: fallbackReply(lastQ), demo: true });
  }
}
