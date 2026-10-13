'use client';
import { useEffect, useRef, useState } from 'react';

/** Scales a fixed-size design (baseW px wide) down to fit its container. Never scales above 1. */
export function useFitScale<T extends HTMLElement>(baseW: number) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setScale(Math.min(1, el.clientWidth / baseW));
      setReady(true);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseW]);
  return { ref, scale, ready };
}

export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}
