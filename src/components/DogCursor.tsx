'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * A small 3D dog that chases the cursor. Desktop only (fine pointer, wide screen), skipped when the visitor
 * prefers reduced motion. three.js is loaded lazily so it never blocks the first paint.
 */
export default function DogCursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [bark, setBark] = useState(false);

  useEffect(() => {
    const ok = window.matchMedia('(pointer: fine) and (min-width: 900px)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ok || reduce || !wrap.current || !canvas.current) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;
    let barkTimer = 0;

    import('@/lib/dogReal').then(({ createDogReal }) => {
      if (cancelled || !wrap.current || !canvas.current) return;
      const dog = createDogReal(canvas.current, { width: 168, height: 126, container: wrap.current });
      if (!dog) return;
      const move = (e: PointerEvent) => dog.setTarget(e.clientX, e.clientY);
      const leave = () => dog.clearTarget();
      const down = () => {
        dog.bark();
        setBark(true);
        window.clearTimeout(barkTimer);
        barkTimer = window.setTimeout(() => setBark(false), 900);
      };
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('mouseleave', leave);
      window.addEventListener('pointerdown', down);
      dispose = () => {
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('mouseleave', leave);
        window.removeEventListener('pointerdown', down);
        dog.dispose();
      };
    });

    return () => {
      cancelled = true;
      window.clearTimeout(barkTimer);
      if (dispose) dispose();
    };
  }, []);

  return (
    <div ref={wrap} className="dog-wrap" aria-hidden="true">
      {bark && <div className="dog-bubble">Woof!</div>}
      <canvas ref={canvas} className="dog-canvas" width={168} height={126} />
    </div>
  );
}
