import Ico from './Ico.jsx';
import Logo from './Logo.jsx';
import { useLang } from '../context/lang.jsx';

export default function TopBar({ active, onNavigate, shopInfo, dueCount, onLogout }) {
  const t = useLang();
  const shopName = shopInfo?.shopName || 'Your Shop';
  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const NAV = [
    { id: 'dashboard', label: t.home, Ic: Ico.Home },
    { id: 'customers', label: t.customers, Ic: Ico.Users },
    { id: 'reminders', label: t.reminders, Ic: Ico.Bell },
    { id: 'settings', label: t.settings, Ic: Ico.Gear },
  ];

  return (
    <header className="hidden sm:block bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="w-full px-6 xl:px-8 2xl:px-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 h-14">
          <div className="flex items-center gap-3 min-w-0 justify-self-start">
            <Logo size={34} />
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-none tracking-tight">MediKhata</p>
              <p className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{shopName}</p>
            </div>
          </div>

          <nav
            className="justify-self-center flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1"
            aria-label="Main navigation"
          >
            {NAV.map((item) => {
              const NavIcon = item.Ic;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-200 focus-ring ${
                    isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    <NavIcon />
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'reminders' && dueCount > 0 && (
                    <span className="bg-red-500 text-white font-semibold px-1.5 py-0.5 rounded-full text-[9px] leading-none min-w-[16px] text-center">
                      {dueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="justify-self-end flex items-center gap-2">
            <div className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm">
              <p className="text-xs text-slate-800 font-semibold whitespace-nowrap tracking-tight">
                {dateLabel}
              </p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out"
                aria-label="Log out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors focus-ring"
              >
                <Ico.Logout />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
