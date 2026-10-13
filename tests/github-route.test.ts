import { readFileSync } from 'node:fs';
import { GET } from '../src/app/api/github/route';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failed++;
};

async function main() {
  // the REAL public-events response captured from api.github.com for the account (only created_at + type kept)
  const real = JSON.parse(readFileSync(new URL('./fixtures/github-events.json', import.meta.url), 'utf8')) as { created_at: string }[];
  const g = globalThis as any;
  const original = g.fetch;

  // ---- 1. counting: freeze "today" to the day after the capture so the fixture falls inside the 48-day window
  const RealDate = Date;
  const newest = real.map((e) => e.created_at).sort().pop()!;
  const fakeNow = new RealDate(new RealDate(newest).getTime() + 86400000).getTime();
  g.Date = class extends RealDate { constructor(...a: any[]) { if (a.length) { super(...(a as [any])); } else { super(fakeNow); } } static now() { return fakeNow; } };

  let calls = 0;
  g.fetch = async () => { calls++; return { ok: true, json: async () => (calls === 1 ? real : []) }; };
  const body = await (await GET()).json();

  const perDay: Record<string, number> = {};
  for (const e of real) { const k = e.created_at.slice(0, 10); perDay[k] = (perDay[k] || 0) + 1; }
  const expectedTotal = Object.values(perDay).reduce((a, b) => a + b, 0);

  check('reports live data', body.live === true);
  check('returns 48 daily buckets', Array.isArray(body.counts) && body.counts.length === 48, String(body.counts?.length));
  check('total equals the number of events', body.total === expectedTotal && expectedTotal === real.length, `${body.total} vs ${expectedTotal}`);
  check('active-day count matches an independent calculation', body.counts.filter((c: number) => c > 0).length === Object.keys(perDay).length, `${body.counts.filter((c: number) => c > 0).length} vs ${Object.keys(perDay).length}`);
  // "today" was frozen to the day after the newest event: today (index 47) is empty, yesterday (46) holds the newest day
  check('newest event day lands in yesterday\'s bucket', body.counts[46] === perDay[newest.slice(0, 10)], `${body.counts[46]} vs ${perDay[newest.slice(0, 10)]}`);
  check('today\'s bucket is empty', body.counts[47] === 0, String(body.counts[47]));
  g.Date = RealDate;

  // ---- 2. failure paths must never claim to be live
  g.fetch = async () => ({ ok: false, json: async () => ({}) });
  const limited = await (await GET()).json();
  check('rate-limited (HTTP 403) -> not live, empty', limited.live === false && limited.total === 0 && limited.counts.length === 0);

  g.fetch = async () => { throw new Error('network down'); };
  const down = await (await GET()).json();
  check('network error -> not live, empty', down.live === false && down.counts.length === 0);

  g.fetch = original;
  console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL API CHECKS PASSED');
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
