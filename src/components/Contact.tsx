'use client';
import { useEffect, useRef, useState } from 'react';
import { profile } from '@/data/content';

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!profile.email) return;
    try { await navigator.clipboard.writeText(profile.email); } catch { /* clipboard blocked, mailto still works */ }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="contact" className="section">
      <div className="contact-box">
        <div className="contact-inner">
          <h2 className="contact-title">
            Let&apos;s build<br /><span className="shimmer">something.</span>
          </h2>
          <p>{profile.availability.open ? `Open to ${profile.availability.detail.toLowerCase()} work.` : 'Not taking new work right now, but say hello.'}</p>
          <div className="contact-actions">
            {profile.email ? (
              <a className="btn btn-primary" href={`mailto:${profile.email}`} onClick={copy}>{copied ? 'Copied ✓' : profile.email}</a>
            ) : (
              <button className="btn btn-primary" disabled>[your@email.com]</button>
            )}
            <a className="btn btn-glass glass" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            {profile.linkedin ? (
              <a className="btn btn-glass glass" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            ) : (
              <button className="btn btn-glass glass" disabled>[LinkedIn]</button>
            )}
            {profile.cv ? (
              <a className="btn btn-glass glass" href={profile.cv} download>Download CV</a>
            ) : (
              <button className="btn btn-glass glass" disabled>Download CV</button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
