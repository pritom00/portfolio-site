'use client';
import { useEffect, useState } from 'react';
import { layers, profile } from '@/data/content';

const HEAT = ['rgba(255,255,255,0.18)', '#B5FDCE', '#20BE35', '#14902A', '#FFCE06'];
const SAMPLE = [0,1,2,1,0,2,3,1, 1,2,3,2,1,0,2,4, 0,1,1,2,3,3,2,1, 2,3,2,4,2,1,0,1, 1,0,2,3,2,2,3,2, 0,1,2,1,3,4,2,1];
const DEFAULT_LEVELS = [70, 56, 42];
const icon = { fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export default function HeroCards({ sel }: { sel: number }) {
  const [heat, setHeat] = useState<{ levels: number[]; live: boolean; total: number }>({ levels: SAMPLE, live: false, total: 0 });

  // real public GitHub activity (cached on the server for an hour); falls back to a sample pattern
  useEffect(() => {
    let off = false;
    fetch('/api/github')
      .then((r) => r.json())
      .then((d: { counts: number[]; total: number; live: boolean }) => {
        if (off || !d.live || d.counts.length !== 48) return;
        setHeat({ levels: d.counts.map(level), live: true, total: d.total });
      })
      .catch(() => {});
    return () => { off = true; };
  }, []);

  const skillLayers = layers.slice(0, 3);

  return (
    <div className="hero-right">
      <div className="hcard glass">
        <div className="hc-head">
          <span><svg width="16" height="16" viewBox="0 0 24 24" {...icon} aria-hidden="true"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>Skill stack</span>
        </div>
        <div className="skill-legend">
          {skillLayers.map((l) => <span key={l.id}><i style={{ background: l.color }} />{l.name.replace(' & Agents', '')}</span>)}
        </div>
        <div className="bars">
          {skillLayers.map((l, k) => {
            const h = l.level ?? DEFAULT_LEVELS[k];
            return (
              <div key={l.id} className="bar" style={{ opacity: sel <= 2 ? (sel === k ? 1 : 0.45) : 0.85 }}>
                <div className="bar-fill" style={{ height: `${h}%`, background: `linear-gradient(180deg, ${l.color}, rgba(${l.rgb}, 0.6))`, animationDelay: `${k * 0.15}s` }} />
                <div className="bar-bubble" style={{ top: Math.round(150 * (1 - h / 100) - 13) }}>{l.level ? `${l.level}%` : '[%]'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hcard glass">
        <div className="hc-head">
          <span><svg width="16" height="16" viewBox="0 0 24 24" {...icon} aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" /></svg>Availability</span>
        </div>
        <div className={`avail-box${profile.availability.open ? '' : ' closed'}`}>
          <div className="avail-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A0E06" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg></div>
          <div className="avail-text"><b>{profile.availability.open ? profile.availability.label : 'Not available'}</b><small>{profile.availability.detail}</small></div>
        </div>
        <div className="avail-steps" aria-hidden="true">
          {layers.map((l, i) => <i key={l.id} style={i === sel ? { background: l.color, boxShadow: `0 0 14px ${l.color}` } : undefined} />)}
        </div>
      </div>

      <div className="hcard glass">
        <div className="hc-head">
          <span><svg width="16" height="16" viewBox="0 0 24 24" {...icon} aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>GitHub activity</span>
        </div>
        <div className="grid-legend" aria-hidden="true">Less{[HEAT[0], HEAT[1], HEAT[2], HEAT[4]].map((c) => <i key={c} style={{ background: c }} />)}More</div>
        <div className="heat" role="img" aria-label={heat.live ? `${heat.total} public GitHub events in the last 48 days` : 'Sample activity pattern'}>
          {heat.levels.map((lv, i) => <i key={i} className="cell" style={{ background: HEAT[lv], animationDelay: `${((i * 37) % 30) / 10}s` }} />)}
        </div>
        <div className="heat-note">{heat.live ? `${heat.total} public events, last 48 days` : 'Sample pattern'}</div>
      </div>
    </div>
  );
}
