'use client';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { projects as ALL } from '@/data/content';
import ProjectPreview from './ProjectPreview';
import { useFitScale, usePrefersReducedMotion } from '@/lib/hooks';

type Phase = 'pre' | 'in' | 'idle' | 'out';
type Tab = 'problem' | 'solution' | 'result';
type Spin = { id: number; n: number } | null;

const FILTER_LABELS: Record<string, string> = { all: 'All', ai: 'AI', fullstack: 'Full-stack', tools: 'Tools' };
const TABS: [Tab, string][] = [['problem', 'Problem'], ['solution', 'Solution'], ['result', 'Result']];
const GLYPHS = '!<>-_\\/[]{}=+*^?#';

/** where a card sits when it is "blown away": deterministic per index so it looks the same every time */
function scatter(i: number): string {
  const a = i * 2.4 + 0.7;
  return `translateX(${Math.round(Math.cos(a) * 640)}px) translateY(${Math.round(Math.sin(a) * 280)}px) translateZ(-520px) rotateZ(${(i % 2 ? 1 : -1) * (130 + i * 45)}deg) rotateX(70deg) scale(0.3)`;
}

export default function Projects() {
  const reduce = usePrefersReducedMotion();
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(0);
  const [tab, setTab] = useState<Tab>('problem');
  const [auto, setAuto] = useState(true);
  const [phase, setPhase] = useState<Phase>('pre');
  const [pk, setPk] = useState(0); // bumps on every change, used to restart one-shot animations
  const [spin, setSpin] = useState<Spin>(null);
  const [scr, setScr] = useState(1); // title scramble progress 0..1
  const { ref: fitRef, scale, ready } = useFitScale<HTMLDivElement>(1000);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const hover = useRef(false);
  const entered = useRef(false);
  const timers = useRef<number[]>([]);
  const scrTimer = useRef(0);

  const filters = useMemo(() => ['all', ...Array.from(new Set(ALL.map((p) => p.cat)))], []);
  const list = useMemo(() => ALL.filter((p) => filter === 'all' || p.cat === filter), [filter]);
  const n = list.length;
  const idx = Math.min(sel, Math.max(0, n - 1));
  const cur = list[idx];

  const live = useRef({ auto, phase, idx, n });
  live.current = { auto, phase, idx, n };

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearLater = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  const startScramble = () => {
    window.clearInterval(scrTimer.current);
    let p = 0;
    setScr(0);
    scrTimer.current = window.setInterval(() => {
      p += 0.07;
      if (p >= 1) { window.clearInterval(scrTimer.current); setScr(1); } else setScr(p);
    }, 32);
  };

  const select = (i: number, user: boolean) => {
    if (!n) return;
    setSel(((i % n) + n) % n);
    setPk((k) => k + 1);
    if (user) { setAuto(false); stageRef.current?.focus({ preventScroll: true }); }
    startScramble();
  };

  const enter = () => {
    if (entered.current) return;
    entered.current = true;
    setPhase('in');
    later(() => setPhase('idle'), 2000);
  };

  const runFilter = (f: string) => {
    if (f === filter) return;
    clearLater();
    setAuto(false);
    setPhase('out');
    later(() => {
      setFilter(f); setSel(0); setPhase('pre'); setPk((k) => k + 1); startScramble();
      later(() => setPhase('in'), 60);
      later(() => setPhase('idle'), 1900);
    }, 560);
  };

  // entrance when scrolled into view (with a safety net), instant for reduced motion
  useEffect(() => {
    if (reduce) { entered.current = true; setPhase('idle'); return; }
    const el = fitRef.current;
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) enter(); }, { threshold: 0.2 });
      io.observe(el);
    } else enter();
    const safety = window.setTimeout(enter, 3500);
    return () => { io?.disconnect(); window.clearTimeout(safety); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // autoplay: only when idle, not hovered, not switched off
  useEffect(() => {
    const t = window.setInterval(() => {
      const s = live.current;
      if (s.auto && !hover.current && s.phase === 'idle' && s.n > 1) {
        setSel((s.idx + 1) % s.n);
        setPk((k) => k + 1);
        startScramble();
      }
    }, 5200);
    return () => window.clearInterval(t);
  }, []);

  // smooth parallax + moving glare: written straight to the DOM from a rAF loop (no re-render per mouse move)
  useEffect(() => {
    const stage = stageRef.current, tilt = tiltRef.current;
    if (!stage || !tilt) return;
    const tgt = { x: 0.5, y: 0.5 }, cur2 = { x: 0.5, y: 0.5 };
    const cl = (v: number) => Math.max(0, Math.min(1, v));
    const move = (e: MouseEvent) => { const r = stage.getBoundingClientRect(); tgt.x = cl((e.clientX - r.left) / r.width); tgt.y = cl((e.clientY - r.top) / r.height); };
    const enterH = () => { hover.current = true; };
    const leave = () => { hover.current = false; tgt.x = 0.5; tgt.y = 0.5; };
    stage.addEventListener('mousemove', move);
    stage.addEventListener('mouseenter', enterH);
    stage.addEventListener('mouseleave', leave);
    let raf = 0;
    const loop = () => {
      cur2.x += (tgt.x - cur2.x) * 0.08;
      cur2.y += (tgt.y - cur2.y) * 0.08;
      tilt.style.transform = `rotateX(${((0.5 - cur2.y) * 9).toFixed(2)}deg) rotateY(${((cur2.x - 0.5) * 14).toFixed(2)}deg)`;
      stage.style.setProperty('--gx', `${(cur2.x * 100).toFixed(1)}%`);
      stage.style.setProperty('--gy', `${(cur2.y * 100).toFixed(1)}%`);
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) loop();
    return () => {
      stage.removeEventListener('mousemove', move);
      stage.removeEventListener('mouseenter', enterH);
      stage.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  useEffect(() => () => { clearLater(); window.clearInterval(scrTimer.current); }, []);

  if (!cur) return null;

  const ab = pk % 2 === 0 ? '' : 'B';
  const title = scr >= 1 ? cur.title : cur.title.split('').map((ch, k) => (ch === ' ' || k < scr * cur.title.length) ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
  const scattered = phase === 'pre' || phase === 'out';

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); select(idx + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); select(idx - 1, true); }
  };

  return (
    <section id="projects" className="section">
      <div className="sec-head">
        <h2 className="sec-title">Selected <span className="shimmer">projects</span></h2>
        <p className="sec-lead">Each one is live. Click a card, use the arrow keys, or filter by type.</p>
      </div>

      <div className="pj-controls">
        <div className="pj-filters" role="group" aria-label="Filter projects">
          {filters.map((f) => (
            <button key={f} className={`pj-filter${filter === f ? ' on' : ''}`} onClick={() => runFilter(f)} aria-pressed={filter === f}>
              {FILTER_LABELS[f] ?? f}<em>{ALL.filter((p) => f === 'all' || p.cat === f).length}</em>
            </button>
          ))}
        </div>
        <button className="pj-auto glass" onClick={() => setAuto((v) => !v)} aria-pressed={auto}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: auto ? '#20BE35' : 'rgba(255,255,255,0.4)' }} />
          {auto ? 'Auto-play on' : 'Auto-play off'}
        </button>
      </div>

      <div className="pj-fit" ref={fitRef} style={{ height: 560 * scale, opacity: ready ? 1 : 0 }}>
        <div className="pj-scale" style={{ transform: `scale(${scale})` }}>
          <div className="pj-stage" ref={stageRef} tabIndex={0} onKeyDown={onKey} role="group" aria-roledescription="carousel" aria-label="Projects">
            <div className="pj-floor-glow" style={{ background: `radial-gradient(closest-side, rgba(${cur.rgb},0.5), transparent)` }} />
            <div className="pj-floor-grid" />
            <div className="pj-ring" style={{ borderColor: cur.color, animation: pk > 0 ? `pjRing${ab} 1.1s ease-out forwards` : 'none' }} />

            <div className="pj-tilt" ref={tiltRef}>
              {list.map((p, i) => {
                const o = i - idx, ao = Math.abs(o), on = o === 0;
                const trans = phase === 'pre' ? 'none'
                  : phase === 'in' ? `transform 1s cubic-bezier(.22,1.3,.36,1) ${i * 80}ms, opacity .6s ease ${i * 80}ms`
                  : phase === 'out' ? `transform .55s cubic-bezier(.6,0,.9,.4) ${i * 40}ms, opacity .45s ease ${i * 40}ms`
                  : 'transform .85s cubic-bezier(.22,1.2,.36,1), opacity .5s ease';
                const wrap: CSSProperties = {
                  transform: scattered ? scatter(i) : `translateX(${o * 270}px) translateZ(${-ao * 150}px) rotateY(${-o * 30}deg) scale(${on ? 1 : 0.9})`,
                  opacity: scattered ? 0 : on ? 1 : ao === 1 ? 0.62 : 0.3,
                  visibility: ao > 2 && !scattered ? 'hidden' : 'visible',
                  zIndex: 20 - ao,
                  cursor: on ? 'default' : 'pointer',
                  transition: trans
                };
                const spinning = spin && spin.id === p.id;
                return (
                  <div
                    key={p.id}
                    className="pj-card"
                    style={wrap}
                    role={on ? undefined : 'button'}
                    tabIndex={on ? -1 : 0}
                    aria-label={on ? undefined : `Show ${p.title}`}
                    onClick={() => (on ? setSpin({ id: p.id, n: (spin?.n ?? 0) + 1 }) : select(i, true))}
                    onKeyDown={(e) => { if (!on && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(i, true); } }}
                  >
                    <div className="pj-spin" style={{ animation: spinning ? `pjSpin${spin!.n % 2 ? '' : 'B'} .95s cubic-bezier(.3,.7,.2,1) both` : 'none' }}>
                      <div className="pj-face" style={{ borderColor: on ? p.color : undefined, boxShadow: on ? `0 0 60px rgba(${p.rgb},0.35)` : 'none' }}>
                        {on && <div className="pj-glare" />}
                        <div className={`pj-media${on ? '' : ' off'}`}>
                          <ProjectPreview kind={p.kind} color={p.color} rgb={p.rgb} />
                        </div>
                        <div className="pj-body">
                          <div className="pj-cat" style={{ color: p.color }}>{p.catLabel}</div>
                          <div className="pj-title">{p.title}</div>
                          <div className="pj-blurb">{p.blurb}</div>
                          <div className="pj-chips">{p.stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                        </div>
                      </div>
                      <div className="pj-badge" style={{ background: p.color, boxShadow: `0 0 24px rgba(${p.rgb},0.6)` }}>{p.tag}</div>
                      <div className="pj-metric" style={{ borderColor: `rgba(${p.rgb},0.5)` }}>
                        <i style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }} />{p.metric}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {n > 1 && (
              <>
                <button className="pj-arrow l glass" onClick={() => select(idx - 1, true)} aria-label="Previous project">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button className="pj-arrow r glass" onClick={() => select(idx + 1, true)} aria-label="Next project">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
                <div className="pj-dots">
                  {list.map((p, i) => (
                    <button key={p.id} className="pj-dot" onClick={() => select(i, true)} aria-label={`Project ${i + 1}`} aria-current={i === idx}
                      style={{ width: i === idx ? 28 : 8, background: i === idx ? p.color : 'rgba(255,255,255,0.3)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="pj-detail glass" style={{ borderColor: cur.color }} aria-live="polite">
        <div className="pj-sweep" style={{ background: `linear-gradient(100deg, transparent, rgba(${cur.rgb},0.38), transparent)`, animationName: `pjSweep${ab}` }} />
        <div className="pj-dl" style={{ animation: `pjWipe${ab} .75s cubic-bezier(.2,.8,.2,1) both` }}>
          <div className="pj-d-head">
            <span className="pj-d-title" style={{ animation: `pjGlitch${ab} .6s ease-out both` }}>{title}</span>
            <span className="pj-d-tag" style={{ background: cur.color }}>{cur.tag}</span>
          </div>
          <div className="pj-tabs" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className="pj-tab" onClick={() => setTab(k)}
                style={tab === k ? { background: cur.color, color: '#0A0E06', borderColor: cur.color } : undefined}>{label}</button>
            ))}
          </div>
          <p className="pj-text" key={`${cur.id}-${tab}`} style={{ animation: 'swap .5s cubic-bezier(.2,.8,.2,1) both' }}>{cur[tab]}</p>
        </div>
        <div className="pj-dr" style={{ animation: `pjWipe${ab} .75s cubic-bezier(.2,.8,.2,1) .12s both` }}>
          <div className="pj-label">Built with</div>
          <div className="pj-chips">{cur.stack.map((t) => <span key={t} className="chip">{t}</span>)}</div>
          <div className="pj-metrics">
            {cur.metrics.map((m, i) => (
              <div key={i} className="pj-tile"><b style={{ color: cur.color }}>{m.v}</b><small>{m.l}</small></div>
            ))}
          </div>
          <div className="pj-actions">
            {cur.demo
              ? <a className="btn" href={cur.demo} target="_blank" rel="noreferrer" style={{ background: cur.color, color: '#0A0E06', boxShadow: `0 0 30px rgba(${cur.rgb},0.45)` }}>Live demo</a>
              : <button className="btn" disabled style={{ background: cur.color, color: '#0A0E06' }}>Live demo</button>}
            <a className="btn btn-glass glass" href={cur.repo} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </div>
    </section>
  );
}
