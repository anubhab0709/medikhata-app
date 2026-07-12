import Logo from './Logo.jsx';

export default function MobileHeader({ shopInfo }) {
  const shopName = shopInfo?.shopName || 'Your Shop';

  return (
    <header className="sm:hidden flex items-center justify-between px-3 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="flex items-center gap-2 min-w-0">
        <Logo size={28} />
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-[13px] leading-tight tracking-tight">MediKhata</p>
          <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{shopName}</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-md px-2 py-1 border border-slate-100 shrink-0">
        <span className="text-[10px] text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </header>
  );
}
