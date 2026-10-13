'use client';
import { useEffect, useRef, useState } from 'react';
import { layers, profile, rotatingWords } from '@/data/content';
import SystemMap from './SystemMap';
import HeroCards from './HeroCards';

export default function Hero() {
  const [sel, setSel] = useState(2);
  const [explode, setExplode] = useState(true);
  const [auto, setAuto] = useState(true);
  const [wi, setWi] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const cur = layers[sel];

  // guided tour through the layers until the visitor takes over
  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => setSel((s) => (s + 1) % layers.length), 3200);
    return () => window.clearInterval(t);
  }, [auto]);

  useEffect(() => {
    const t = window.setInterval(() => setWi((w) => (w + 1) % rotatingWords.length), 2400);
    return () => window.clearInterval(t);
  }, []);

  // cursor spotlight + background parallax, written straight to CSS variables (no React re-render)
  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tgt = { x: 0.5, y: 0.5 }, cur2 = { x: 0.5, y: 0.5 };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tgt.x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      tgt.y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    };
    let raf = 0;
    const loop = () => {
      cur2.x += (tgt.x - cur2.x) * 0.08;
      cur2.y += (tgt.y - cur2.y) * 0.08;
      el.style.setProperty('--mx', cur2.x.toFixed(4));
      el.style.setProperty('--my', cur2.y.toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    loop();
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  const pick = (i: number) => { setSel(i); setAuto(false); };

  return (
    <section id="top" className="hero" ref={heroRef}>
      <div className="hero-bg" aria-hidden="true">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
        <div className="spot" />
      </div>

      <div className="hero-grid">
        <div className="hero-left">
          <h1 className="headline" aria-label={`${profile.headline[0]} ${profile.headline[1]}`}>
            <span className="hl-line" aria-hidden="true">
              {profile.headline[0].split('').map((c, i) => (
                <span key={i} className="hl-letter" style={{ animationDelay: `${1.9 + i * 0.05}s` }}>{c === ' ' ? '\u00a0' : c}</span>
              ))}
            </span>
            <span className="hl-line" aria-hidden="true"><span className="hl-grad">{profile.headline[1]}</span></span>
          </h1>

          <div className="rotator" aria-live="off">
            <span className="rot-prefix">I build</span>
            <span className="rot-words">
              {rotatingWords.map((w, i) => (
                <span key={w} className={`rot-word${i === wi ? ' on' : ''}`} aria-hidden={i !== wi}>{w}</span>
              ))}
            </span>
          </div>

          <p className="lead">{profile.pitch} Click a layer of the system to see how the pieces fit.</p>

          <div className="cta-row">
            <a className="btn btn-primary" href="#projects">View projects</a>
            <a className="btn btn-glass glass" href={profile.github} target="_blank" rel="noreferrer">github.com/{profile.githubUser}</a>
          </div>

          <div className="layer-card glass">
            <div className="lc-head">
              <span><i className="lc-dot" style={{ background: cur.color, boxShadow: `0 0 12px ${cur.color}` }} />Active layer</span>
              <small>{sel + 1} / {layers.length}</small>
            </div>
            <div className="lc-body" key={sel}>
              <div className="lc-name">{cur.name}</div>
              <div className="lc-desc">{cur.desc}</div>
              <div className="lc-tools">{cur.tools.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </div>
            <div className="lc-divider" />
            <div className="lc-row"><span>Currently building</span><span>{profile.building.name}</span></div>
            <div className="lc-steps" aria-hidden="true">
              {layers.map((l, i) => <i key={l.id} style={i === sel ? { background: l.color } : undefined} />)}
            </div>
          </div>
        </div>

        <SystemMap sel={sel} explode={explode} auto={auto} onSelect={pick} onExplode={() => setExplode((v) => !v)} onAuto={() => setAuto((v) => !v)} />

        <HeroCards sel={sel} />
      </div>
    </section>
  );
}
