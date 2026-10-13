'use client';
import { useEffect, useRef, useState } from 'react';
import { profile } from '@/data/content';

const LINKS: [string, string][] = [
  ['#top', 'Home'],
  ['#projects', 'Projects'],
  ['#skills', 'Skills'],
  ['#demo', 'Live demo']
];

export default function Nav() {
  const bar = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="nav">
      <div className="nav-inner glass">
        <a href="#top" className="logo" aria-label={`${profile.name}, home`}>
          <span className="logo-mark" aria-hidden="true"><i /><i /></span>
          {profile.name}
        </a>
        <button className="nav-toggle" aria-expanded={open} aria-controls="nav-links" onClick={() => setOpen((v) => !v)}>
          <span className="sr-only">Menu</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
          </svg>
        </button>
        <nav id="nav-links" className={`nav-links${open ? ' open' : ''}`} aria-label="Primary">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="nav-link" onClick={() => setOpen(false)}>{label}</a>
          ))}
          <a href={profile.github} className="nav-link" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#contact" className="nav-cta" onClick={() => setOpen(false)}>Hire me</a>
        </nav>
        <div ref={bar} className="nav-progress" aria-hidden="true" />
      </div>
    </header>
  );
}
