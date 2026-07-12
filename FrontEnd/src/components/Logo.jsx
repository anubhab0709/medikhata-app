import { useId } from 'react';

export default function Logo({
  variant = 'color',
  size = 32,
  className = '',
  showWordmark = false,
  wordmarkClassName = '',
}) {
  const uid = useId().replace(/:/g, '');
  const palettes = {
    color: {
      bg: '#2563EB',
      bgEnd: '#1D4ED8',
      mark: '#FFFFFF',
      line: 'rgba(255,255,255,0.55)',
      lineFaint: 'rgba(255,255,255,0.28)',
      shield: 'rgba(255,255,255,0.18)',
    },
    dark: {
      bg: '#0F172A',
      bgEnd: '#1E293B',
      mark: '#FFFFFF',
      line: 'rgba(148,163,184,0.9)',
      lineFaint: 'rgba(148,163,184,0.45)',
      shield: 'rgba(96,165,250,0.25)',
    },
    mono: {
      bg: '#0F172A',
      bgEnd: '#334155',
      mark: '#FFFFFF',
      line: 'rgba(255,255,255,0.55)',
      lineFaint: 'rgba(255,255,255,0.28)',
      shield: 'rgba(255,255,255,0.12)',
    },
    light: {
      bg: '#FFFFFF',
      bgEnd: '#EFF6FF',
      mark: '#2563EB',
      line: 'rgba(37,99,235,0.45)',
      lineFaint: 'rgba(37,99,235,0.22)',
      shield: 'rgba(37,99,235,0.08)',
    },
  };

  const p = palettes[variant] || palettes.color;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showWordmark ? true : undefined}
        role={showWordmark ? undefined : 'img'}
        aria-label={showWordmark ? undefined : 'MediKhata'}
        className="shrink-0 block"
      >
        <defs>
          <linearGradient id={`${uid}-bg`} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor={p.bg} />
            <stop offset="1" stopColor={p.bgEnd} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${uid}-bg)`} />
        <rect x="16" y="14" width="32" height="36" rx="4" fill={p.shield} stroke={p.mark} strokeWidth="1.5" strokeOpacity="0.35" />
        <path d="M24 14v36" stroke={p.mark} strokeWidth="1.25" strokeOpacity="0.25" />
        <rect x="28" y="22" width="16" height="2" rx="1" fill={p.line} />
        <rect x="28" y="28" width="12" height="2" rx="1" fill={p.lineFaint} />
        <rect x="28" y="34" width="14" height="2" rx="1" fill={p.lineFaint} />
        <rect x="28" y="40" width="10" height="2" rx="1" fill={p.lineFaint} />
        <circle cx="46" cy="46" r="10" fill={p.mark} fillOpacity="0.95" />
        <path d="M41.5 46l3 3 6.5-7" stroke={p.bg} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-slate-900 ${wordmarkClassName}`}>
          MediKhata
        </span>
      )}
    </span>
  );
}
