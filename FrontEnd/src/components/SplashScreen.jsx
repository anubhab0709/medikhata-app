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
        background: 'linear-gradient(165deg, #ffffff 0%, #f8fbff 42%, #eff6ff 100%)',
        transitionDuration: reduceMotion ? '40ms' : '140ms',
      }}
      aria-busy={!ready}
      aria-hidden={exiting}
      aria-label="Loading MediKhata"
      role="status"
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="rounded-2xl shadow-lg shadow-primary-600/10 ring-1 ring-slate-200/80 bg-white">
          <Logo variant="color" size={56} />
        </div>

        <p className="mt-5 text-xl font-bold tracking-tight text-slate-900">MediKhata</p>
        <p className="mt-1 text-sm font-medium text-slate-500">Trusted medicine shop ledger</p>

        {!ready && (
          <div className="mt-8 flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="splash-loader h-1.5 w-1.5 rounded-full bg-primary-500/70"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
