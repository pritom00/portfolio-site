'use client';
import { CSSProperties, useState } from 'react';
import { layers } from '@/data/content';

export default function Skills() {
  const [open, setOpen] = useState(2);
  return (
    <section id="skills" className="section">
      <div className="skills-wrap">
        <div className="skills-intro">
          <h2 className="sec-title">The stack,<br />layer by layer</h2>
          <p>The same five layers as the 3D map at the top of the page. Open one to see how I work with it.</p>
        </div>
        <div className="skills-list">
          {layers.map((l, i) => {
            const on = i === open;
            return (
              <button
                key={l.id}
                className="skill-row glass"
                aria-expanded={on}
                onClick={() => setOpen(i)}
                style={{ borderColor: on ? l.color : undefined, boxShadow: on ? `0 0 40px rgba(${l.rgb},0.33)` : 'none' } as CSSProperties}
              >
                <div className="skill-head">
                  <span className="skill-dot" style={{ background: l.color, boxShadow: `0 0 14px ${l.color}` }} />
                  <span className="skill-name" style={{ fontWeight: on ? 600 : 500 }}>{l.name}</span>
                  <span className="skill-tools">{l.tools.map((t) => <span key={t} className="chip">{t}</span>)}</span>
                </div>
                {on && (
                  <div className="skill-open">
                    <p>{l.desc}</p>
                    <div className="skill-meter">
                      <span>Proficiency</span>
                      <span className="skill-track"><span className="skill-fill" style={{ width: `${l.level ?? 50}%`, background: l.color }} /></span>
                      <span>{l.level ? `${l.level}%` : '[%]'}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
