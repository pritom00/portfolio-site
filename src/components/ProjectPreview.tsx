import type { ProjectKind } from '@/data/content';

/** The small animated "screen" drawn on each project card. Purely decorative. */
export default function ProjectPreview({ kind, color, rgb }: { kind: ProjectKind; color: string; rgb: string }) {
  return (
    <div className="pj-media-bg" style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(${rgb},0.34), rgba(5,8,3,0.7))` }}>
      <div className="pj-media-grid" />
      <div className="pj-scan" style={{ background: `linear-gradient(180deg, transparent, rgba(${rgb},0.28), transparent)` }} />

      {kind === 'chat' && (
        <div className="pv">
          <div className="pv-chat">
            <div className="pv-bubble-u" style={{ background: color }} />
            <div className="pv-bubble-a"><span style={{ width: '90%' }} /><span style={{ width: '60%' }} /></div>
            <div className="pv-typing"><i /><i /><i /></div>
          </div>
          <div className="pv-input" />
        </div>
      )}

      {kind === 'dash' && (
        <div className="pv">
          <div className="pv-tiles"><i /><i /><i style={{ background: `rgba(${rgb},0.35)` }} /></div>
          <div className="pv-bars">
            {[100, 78, 92, 60, 84, 70].map((h, i) => (
              <i key={i} style={{ height: `${h}%`, background: color, opacity: 0.7 + (i % 3) * 0.1, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {kind === 'graph' && (
        <svg className="pv-graph" viewBox="0 0 312 180" aria-hidden="true">
          <g className="flow" stroke={color} strokeWidth="1.6" fill="none" strokeDasharray="6 6">
            <path d="M56 90 L130 42" /><path d="M56 90 L130 138" /><path d="M130 42 L214 90" />
            <path d="M130 138 L214 90" /><path d="M214 90 L268 52" /><path d="M214 90 L268 128" />
          </g>
          <g fill={color}>
            <circle cx="56" cy="90" r="9" /><circle cx="130" cy="42" r="7" /><circle cx="130" cy="138" r="7" />
            <circle cx="214" cy="90" r="11" /><circle cx="268" cy="52" r="6" /><circle cx="268" cy="128" r="6" />
          </g>
          <g fill="none" stroke={color} strokeWidth="1.5">
            <circle className="pulse" cx="214" cy="90" r="11" />
            <circle className="pulse" cx="56" cy="90" r="9" style={{ animationDelay: '.7s' }} />
          </g>
        </svg>
      )}

      {kind === 'term' && (
        <div className="pv pv-term">
          <div className="dots"><i /><i /><i /></div>
          <div className="ln" style={{ animationDelay: '.2s' }}><span style={{ color }}>$</span> npm run build</div>
          <div className="ln" style={{ animationDelay: '1.9s', animationDuration: '1.4s', color: 'rgba(255,255,255,0.7)' }}>compiled successfully</div>
          <div className="ln" style={{ animationDelay: '3.4s' }}><span style={{ color }}>$</span> deploy --prod</div>
          <div className="ln" style={{ animationDelay: '5.1s', animationDuration: '1.2s', color }}>live <span className="caret">▍</span></div>
        </div>
      )}
    </div>
  );
}
