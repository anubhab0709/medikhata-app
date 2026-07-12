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
      line: 'rgba(255,255,255,0.9)',
      lineMid: 'rgba(255,255,255,0.7)',
      lineFaint: 'rgba(255,255,255,0.45)',
      shield: 'rgba(255,255,255,0.28)',
      spine: 'rgba(255,255,255,0.55)',
    },
    dark: {
      bg: '#0F172A',
      bgEnd: '#1E293B',
      mark: '#FFFFFF',
      line: 'rgba(226,232,240,0.95)',
      lineMid: 'rgba(148,163,184,0.85)',
      lineFaint: 'rgba(148,163,184,0.55)',
      shield: 'rgba(96,165,250,0.28)',
      spine: 'rgba(148,163,184,0.7)',
    },
    mono: {
      bg: '#0F172A',
      bgEnd: '#334155',
      mark: '#FFFFFF',
      line: 'rgba(255,255,255,0.9)',
      lineMid: 'rgba(255,255,255,0.7)',
      lineFaint: 'rgba(255,255,255,0.45)',
      shield: 'rgba(255,255,255,0.18)',
      spine: 'rgba(255,255,255,0.5)',
    },
    light: {
      bg: '#FFFFFF',
      bgEnd: '#EFF6FF',
      mark: '#2563EB',
      line: 'rgba(37,99,235,0.85)',
      lineMid: 'rgba(37,99,235,0.6)',
      lineFaint: 'rgba(37,99,235,0.35)',
      shield: 'rgba(37,99,235,0.12)',
      spine: 'rgba(37,99,235,0.45)',
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

        {/* Khata / ledger — larger and more opaque */}
        <rect x="13" y="11" width="34" height="40" rx="5" fill={p.shield} stroke={p.mark} strokeWidth="2" strokeOpacity="0.55" />
        <path d="M22 11.5v39" stroke={p.spine} strokeWidth="2" strokeLinecap="round" />
        {/* Binding holes */}
        <circle cx="17.5" cy="22" r="1.4" fill={p.mark} fillOpacity="0.55" />
        <circle cx="17.5" cy="31" r="1.4" fill={p.mark} fillOpacity="0.55" />
        <circle cx="17.5" cy="40" r="1.4" fill={p.mark} fillOpacity="0.55" />
        {/* Entry lines */}
        <rect x="26" y="20" width="16" height="2.5" rx="1.25" fill={p.line} />
        <rect x="26" y="27" width="13" height="2.5" rx="1.25" fill={p.lineMid} />
        <rect x="26" y="34" width="15" height="2.5" rx="1.25" fill={p.lineMid} />
        <rect x="26" y="41" width="11" height="2.5" rx="1.25" fill={p.lineFaint} />

        {/* Verified check badge */}
        <circle cx="47" cy="47" r="11" fill={p.mark} fillOpacity="0.98" />
        <path d="M41.8 47.2l3.2 3.2 7-7.5" stroke={p.bg} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <span className={`font-bold tracking-tight text-slate-900 ${wordmarkClassName}`}>
          MediKhata
        </span>
      )}
    </span>
  );
}
