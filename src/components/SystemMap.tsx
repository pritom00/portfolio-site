'use client';
import { CSSProperties, useEffect, useRef } from 'react';
import { layers } from '@/data/content';
import { useFitScale } from '@/lib/hooks';

type Props = {
  sel: number;
  explode: boolean;
  auto: boolean;
  onSelect: (i: number) => void;
  onExplode: () => void;
  onAuto: () => void;
};

const RX = 58, RZ = -38;

/**
 * The isometric "system map": five glass layers in real 3D (CSS 3D transforms).
 * Tilt follows the pointer; labels counter-rotate so they always face the viewer.
 */
export default function SystemMap({ sel, explode, auto, onSelect, onExplode, onAuto }: Props) {
  const { ref, scale, ready } = useFitScale<HTMLDivElement>(780);
  const rig = useRef<HTMLDivElement>(null);
  const bbs = useRef<(HTMLDivElement | null)[]>([]);
  const gap = explode ? 92 : 34;

  useEffect(() => {
    const el = rig.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tgt = { x: 0.5, y: 0.5 }, cur = { x: 0.5, y: 0.5 };
    const move = (e: PointerEvent) => { tgt.x = e.clientX / window.innerWidth; tgt.y = e.clientY / window.innerHeight; };
    let raf = 0;
    const loop = () => {
      cur.x += (tgt.x - cur.x) * 0.07;
      cur.y += (tgt.y - cur.y) * 0.07;
      const rx = RX - (cur.y - 0.5) * 10;
      const rz = RZ + (cur.x - 0.5) * 18;
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
      const counter = `rotateZ(${(-rz).toFixed(2)}deg) rotateX(${(-rx).toFixed(2)}deg)`;
      bbs.current.forEach((b) => { if (b) b.style.transform = counter; });
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move, { passive: true });
    loop();
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);

  const prev = () => onSelect((sel + layers.length - 1) % layers.length);
  const next = () => onSelect((sel + 1) % layers.length);

  return (
    <div className="map" ref={ref} style={{ height: 640 * scale, opacity: ready ? 1 : 0 }}>
      <div className="map-inner" style={{ transform: `scale(${scale})` }}>
        <div className="map-scene">
          <div className="ground-glow" />
          <div className="rig" ref={rig} style={{ transform: `rotateX(${RX}deg) rotateZ(${RZ}deg)` }}>
            <div className="beam" style={{ height: 4 * gap + 26 }}>
              <i className="packet p1" /><i className="packet p2" /><i className="packet p3" />
            </div>
            {layers.map((L, i) => {
              const on = i === sel;
              const z = (4 - i) * gap + (on ? 26 : 0);
              const right = i % 2 === 0;
              return (
                <div
                  key={L.id}
                  className={`layer${on ? ' on' : ''}`}
                  style={{ transform: `translateZ(${z}px)`, ['--c' as string]: L.color, ['--rgb' as string]: L.rgb, ['--d' as string]: `${-i * 0.9}s` } as CSSProperties}
                >
                  <div className="layer-float">
                    <div className="plate" onClick={() => onSelect(i)} />
                    <div className="ring" />
                    <div className={`anchor ${right ? 'r' : 'l'}`}>
                      <div ref={(n) => { bbs.current[i] = n; }} style={{ transform: `rotateZ(${-RZ}deg) rotateX(${-RX}deg)` }}>
                        <button className="hs" onClick={() => onSelect(i)} aria-pressed={on} aria-label={`${L.name} layer`}>
                          {right && <><span className="hs-dot" /><span className="hs-line" /></>}
                          <span className="hs-label">{L.name}</span>
                          {!right && <><span className="hs-line" /><span className="hs-dot" /></>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="map-controls glass">
          <button className="ctl-btn round" onClick={prev} aria-label="Previous layer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button className="ctl-btn" onClick={onExplode} style={{ minWidth: 112 }}>{explode ? 'Collapse' : 'Explode'}</button>
          <button className="ctl-btn" onClick={onAuto} style={{ minWidth: 140 }} aria-pressed={auto}>
            <span className="ctl-dot" style={{ background: auto ? '#20BE35' : 'rgba(255,255,255,0.4)' }} />
            {auto ? 'Auto-tour on' : 'Auto-tour off'}
          </button>
          <button className="ctl-btn round" onClick={next} aria-label="Next layer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
