'use client';

import { useEffect, useRef } from 'react';

/**
 * THE HERO MOMENT — six strings stretched across the dark.
 *
 * Each string is modelled as a genuinely plucked one: the first three
 * harmonics of a standing wave, amplitudes weighted by where along the length
 * it was struck, each decaying on its own time constant so the high harmonics
 * die away first and the fundamental rings on. Moving the cursor near a string
 * plucks it at that point. Left alone, one string is touched every few seconds
 * so the field stays alive without anyone doing anything.
 *
 * Canvas rather than WebGL: this is six polylines. Three.js would be 600 KB to
 * draw what 2D context draws for free, and GSAP cannot model a wave equation.
 *
 * It stops completely when off screen, when the tab is hidden, on reduced
 * motion, and on low-powered touch devices, where it renders one static frame.
 */

const STRING_COUNT = 6;
/** Thickest to thinnest, like a guitar from low E to high E. */
const GAUGES = [1.9, 1.65, 1.4, 1.2, 1.0, 0.85];
const HARMONICS = 3;
/** Pixels of maximum deflection. Deliberately small: this is a hum, not a jump. */
const MAX_AMPLITUDE = 26;
const PLUCK_RADIUS = 90;

interface StringState {
  /** Vertical rest position, 0-1 of canvas height. */
  y: number;
  gauge: number;
  /** Fundamental angular frequency. Lower strings move more slowly. */
  omega: number;
  amplitude: number;
  /** 0-1 along the length, where it was last plucked. */
  pluckAt: number;
  /** Seconds since the pluck. */
  age: number;
}

export function HeroStrings({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext('2d', { alpha: true });
    if (!context) return;

    // Explicit non-null types: control-flow narrowing from the guards above
    // does not reach into the hoisted function declarations below.
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A coarse pointer with few cores is a phone that would rather have battery.
    const lowPower =
      window.matchMedia('(pointer: coarse)').matches &&
      (navigator.hardwareConcurrency ?? 4) <= 4;

    const strings: StringState[] = Array.from({ length: STRING_COUNT }, (_, i) => ({
      y: (i + 1) / (STRING_COUNT + 1),
      gauge: GAUGES[i],
      omega: 5.2 + i * 1.45,
      amplitude: 0,
      pluckAt: 0.5,
      age: 0,
    }));

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /** Displacement of a plucked string at position u (0-1), age t seconds. */
    function displace(s: StringState, u: number): number {
      if (s.amplitude < 0.01) return 0;
      let sum = 0;
      for (let n = 1; n <= HARMONICS; n += 1) {
        const shape = Math.sin(n * Math.PI * s.pluckAt) / (n * n);
        const decay = Math.exp(-s.age / (2.6 / n));
        sum += shape * Math.sin(n * Math.PI * u) * Math.cos(n * s.omega * s.age) * decay;
      }
      return sum * s.amplitude;
    }

    function pluck(s: StringState, at: number, force: number) {
      s.pluckAt = Math.min(0.92, Math.max(0.08, at));
      s.amplitude = Math.min(MAX_AMPLITUDE, force);
      s.age = 0;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const s of strings) {
        const restY = s.y * height;
        const active = s.amplitude > 0.01;

        ctx.beginPath();
        const step = 6;
        for (let x = 0; x <= width; x += step) {
          const u = width === 0 ? 0 : x / width;
          const y = restY + displace(s, u);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const energy = Math.min(1, s.amplitude / MAX_AMPLITUDE);
        ctx.lineWidth = s.gauge;
        ctx.strokeStyle = `rgba(224, 169, 63, ${0.2 + energy * 0.55})`;

        if (active && energy > 0.15) {
          // Only the moving string gets a glow, and only while it moves.
          ctx.shadowBlur = 14 * energy;
          ctx.shadowColor = 'rgba(224, 169, 63, 0.6)';
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    let raf = 0;
    let last = performance.now();
    let running = false;
    let sinceIdlePluck = 0;

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      for (const s of strings) {
        if (s.amplitude > 0.01) {
          s.age += dt;
          s.amplitude *= Math.exp(-dt * 0.55);
          if (s.amplitude < 0.01) s.amplitude = 0;
        }
      }

      // Something is always very faintly moving, even with no cursor.
      sinceIdlePluck += dt;
      if (sinceIdlePluck > 3.4) {
        sinceIdlePluck = 0;
        const s = strings[Math.floor(Math.random() * strings.length)];
        pluck(s, 0.25 + Math.random() * 0.5, 3 + Math.random() * 3);
      }

      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || lowPower) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    }

    function onPointerMove(event: PointerEvent) {
      if (reduceMotion || lowPower) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

      for (const s of strings) {
        const distance = Math.abs(s.y * rect.height - y);
        if (distance > PLUCK_RADIUS) continue;
        const force = (1 - distance / PLUCK_RADIUS) * MAX_AMPLITUDE * 0.8;
        // Do not re-pluck a string that is already ringing harder than this.
        if (force > s.amplitude) pluck(s, x / rect.width, force);
      }
    }

    // Tracked separately: re-observing an already-observed element is a no-op
    // that fires no callback, so the visibility handler cannot rely on it.
    let onScreen = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) start();
    };

    resize();
    draw(); // One static frame, so reduced-motion and low-power still see strings.

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);
    observer.observe(canvas);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`inert-layer absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
