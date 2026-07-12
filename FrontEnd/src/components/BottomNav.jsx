import { useLang } from '../context/lang.jsx';
import Ico from '../utils/icons.jsx';

function NavItem({ item, isActive, onNavigate, dueCount }) {
  const NavIcon = item.Ic;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      className={`flex-1 flex flex-col items-center gap-0.5 transition-colors relative py-1 min-h-[44px] focus-ring rounded-lg ${isActive ? 'text-primary-600' : 'text-slate-500'}`}
    >
      <div className={`relative flex h-7 w-7 items-center justify-center rounded-lg ${isActive ? 'bg-primary-50 text-primary-600' : 'text-slate-600'}`}>
        <NavIcon />
        {item.id === 'reminders' && dueCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-medium ring-2 ring-white text-[8px] min-w-[14px] h-3.5 px-0.5">
            {dueCount > 99 ? '99+' : dueCount}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary-600' : 'text-slate-600'}`}>{item.label}</span>
      {isActive && (
        <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary-600" aria-hidden="true" />
      )}
    </button>
  );
}

export default function BottomNav({ active, onNavigate, onAdd, dueCount, isModalOpen }) {
  const t = useLang();
  const LEFT = [
    { id: 'dashboard', label: t.home, Ic: Ico.Home },
    { id: 'customers', label: t.customers, Ic: Ico.Users },
  ];
  const RIGHT = [
    { id: 'reminders', label: t.reminders, Ic: Ico.Bell },
    { id: 'settings', label: t.settings, Ic: Ico.Gear },
  ];

  return (
    <nav
      className={`sm:hidden fixed bottom-0 left-0 right-0 z-[40] bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-pb transition-transform duration-200 ${
        isModalOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      aria-label="Main navigation"
    >
      <div className="flex items-end px-1 pt-1.5 pb-1">
        {LEFT.map((item) => (
          <NavItem key={item.id} item={item} isActive={active === item.id} onNavigate={onNavigate} dueCount={dueCount} />
        ))}

        <div className="flex-1 flex flex-col items-center -mt-5">
          <button
            type="button"
            onClick={onAdd}
            aria-label={t.addCustomer}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-4 ring-white transition-transform active:scale-95 focus-ring"
          >
            <Ico.Plus />
          </button>
          <span className="mt-0.5 text-[10px] font-semibold text-slate-600">Add</span>
        </div>

        {RIGHT.map((item) => (
          <NavItem key={item.id} item={item} isActive={active === item.id} onNavigate={onNavigate} dueCount={dueCount} />
        ))}
      </div>
    </nav>
  );
}
