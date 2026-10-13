'use client';
import { useState } from 'react';

/** One orchestrated moment on load. Removes itself from the DOM when finished. */
export default function BootIntro() {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <div className="boot" aria-hidden="true" onAnimationEnd={(e) => { if (e.target === e.currentTarget) setDone(true); }}>
      <div className="boot-label">INITIALIZING SYSTEM</div>
      <div className="boot-bar"><div className="boot-fill" /></div>
    </div>
  );
}
