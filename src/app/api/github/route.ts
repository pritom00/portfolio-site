import { NextResponse } from 'next/server';
import { profile } from '@/data/content';

// Render on request (never at build time). The GitHub fetches below are cached for an hour by Next's data cache.
export const dynamic = 'force-dynamic';

const DAYS = 48;

/** Returns commit/PR/issue activity per day for the last 48 days (public events only), cached for an hour. */
export async function GET() {
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'portfolio-site' };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const counts = new Array<number>(DAYS).fill(0);
    let gotData = false;
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);   // GitHub timestamps are UTC, so bucket by UTC day on any server
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(`https://api.github.com/users/${profile.githubUser}/events/public?per_page=100&page=${page}`, { headers, next: { revalidate: 3600 } });
      if (!res.ok) break;
      gotData = true;
      const events: { created_at: string; type: string }[] = await res.json();
      if (!events.length) break;
      for (const e of events) {
        const d = new Date(e.created_at); d.setUTCHours(0, 0, 0, 0);
        const age = Math.round((today.getTime() - d.getTime()) / 86400000);
        if (age >= 0 && age < DAYS) counts[DAYS - 1 - age] += 1;
      }
    }
    if (!gotData) return NextResponse.json({ counts: [], total: 0, live: false });
    const total = counts.reduce((a, b) => a + b, 0);
    return NextResponse.json({ counts, total, live: true });
  } catch {
    return NextResponse.json({ counts: [], total: 0, live: false });
  }
}
