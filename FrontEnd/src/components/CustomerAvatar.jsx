const PALETTES = {
  due: 'bg-gradient-to-br from-red-50 to-red-100/80 text-red-700 ring-red-200/60',
  advance: 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-700 ring-emerald-200/60',
  settled: 'bg-gradient-to-br from-slate-100 to-slate-200/60 text-slate-600 ring-slate-200/80',
  neutral: 'bg-gradient-to-br from-primary-50 to-primary-100/70 text-primary-700 ring-primary-200/50',
};

function resolveTone(balance = 0) {
  if (balance > 0) return 'due';
  if (balance < 0) return 'advance';
  if (balance === 0) return 'settled';
  return 'neutral';
}

export default function CustomerAvatar({ name, balance = 0, size = 'md', className = '' }) {
  const tone = resolveTone(balance);
  const sizes = {
    sm: 'h-8 w-8 text-[11px] rounded-lg sm:h-9 sm:w-9 sm:text-xs',
    md: 'h-9 w-9 text-xs rounded-xl sm:h-11 sm:w-11 sm:text-sm',
    lg: 'h-10 w-10 text-sm rounded-xl sm:h-12 sm:w-12 sm:text-base',
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold ring-1 ${sizes[size]} ${PALETTES[tone]} ${className}`}
      aria-hidden="true"
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}
