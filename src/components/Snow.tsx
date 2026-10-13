'use client';
import { CSSProperties, useEffect, useState } from 'react';

type Flake = { left: number; size: number; o: number; blur: number; dur: number; delay: number; dx: number };

/** Falling snow. Flakes are generated after mount so server and client markup match. */
export default function Snow() {
  const [flakes, setFlakes] = useState<Flake[]>([]);
  useEffect(() => {
    const small = window.innerWidth < 700;
    const n = small ? 36 : 80;
    const list: Flake[] = [];
    for (let i = 0; i < n; i++) {
      list.push({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        o: 0.3 + Math.random() * 0.55,
        blur: Math.random() < 0.3 ? 1.5 : 0,
        dur: 9 + Math.random() * 12,
        delay: -Math.random() * 20,
        dx: (Math.random() - 0.5) * 120
      });
    }
    setFlakes(list);
  }, []);
  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="flake"
          style={{
            left: `${f.left}%`, width: f.size, height: f.size, opacity: f.o,
            filter: f.blur ? `blur(${f.blur}px)` : undefined,
            animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`,
            ['--dx' as string]: `${f.dx}px`
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
