import Ico from './Ico.jsx';
import Logo from './Logo.jsx';

export default function MobileHeader({ shopInfo, onLogout }) {
  const shopName = shopInfo?.shopName || 'Your Shop';
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="sm:hidden flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <Logo size={28} />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-[13px] leading-tight tracking-tight">MediKhata</p>
          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{shopName}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-800 font-semibold tracking-tight">
            {dateLabel}
          </span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600"
          >
            <Ico.Logout />
          </button>
        )}
      </div>
    </header>
  );
}
