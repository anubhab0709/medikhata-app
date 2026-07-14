import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.jsx';

/**
 * Full-screen splash shown only while the app initializes.
 * CSS-only exit — keeps framer-motion off the critical path.
 */
export default function SplashScreen({ ready = false, onComplete }) {
  const [gone, setGone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!ready || completedRef.current) return undefined;
    completedRef.current = true;
    setExiting(true);
    const exitMs = reduceMotion ? 40 : 140;
    const t = window.setTimeout(() => {
      setGone(true);
      onComplete?.();
    }, exitMs);
    return () => window.clearTimeout(t);
  }, [ready, onComplete, reduceMotion]);

  if (gone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity ${exiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      style={{
        background: '#2563EB',
        transitionDuration: reduceMotion ? '40ms' : '140ms',
      }}
      aria-busy={!ready}
      aria-hidden={exiting}
      aria-label="Loading KhataApp"
      role="status"
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        {/* White ledger + tick only — no blue tile (page is already blue) */}
        <Logo variant="splash" size={52} />

        <p className="mt-5 text-xl font-bold tracking-tight text-white">KhataApp</p>
        <p className="mt-1.5 text-sm font-medium tracking-wide text-white/80">Manage Better. Grow Faster.</p>

        {!ready && (
          <div className="mt-8 flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="splash-loader h-1.5 w-1.5 rounded-full bg-white/80"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
