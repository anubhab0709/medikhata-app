import { useMemo } from 'react';
import Ico from '../utils/icons.jsx';
import PageHero from '../components/PageHero.jsx';
import CustomerAvatar from '../components/CustomerAvatar.jsx';
import { fmtCur, formatDate, formatTime, daysDiff } from '../utils/data.js';
import { useLang } from '../context/lang.jsx';

function KpiCard({ label, value, hint, tone = 'neutral', icon }) {
  const tones = {
    due: 'card-kpi-accent card-kpi-accent--due border-red-100/80',
    advance: 'card-kpi-accent card-kpi-accent--advance border-emerald-100/80',
    primary: 'card-kpi-accent card-kpi-accent--primary border-primary-100/80',
    amber: 'card-kpi-accent card-kpi-accent--amber border-amber-100/80',
    neutral: 'card-kpi',
  };
  const iconTones = {
    due: 'bg-red-50 text-red-600',
    advance: 'bg-emerald-50 text-emerald-600',
    primary: 'bg-primary-50 text-primary-600',
    amber: 'bg-amber-50 text-amber-600',
    neutral: 'bg-slate-100 text-slate-600',
  };
  const valueTones = {
    due: 'text-red-600',
    advance: 'text-emerald-600',
    primary: 'text-slate-900',
    amber: 'text-amber-700',
    neutral: 'text-slate-900',
  };

  return (
    <div className={tones[tone]}>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="section-label truncate">{label}</p>
          <p className={`kpi-value ${valueTones[tone]}`}>{value}</p>
          {hint && <p className="text-[10px] sm:text-xs text-slate-500 mt-1 hidden sm:block">{hint}</p>}
        </div>
        {icon && (
          <div className={`icon-chip hidden sm:flex ${iconTones[tone]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}

function ChartPlaceholder({ monthlyCredit, monthlyDebit }) {
  const max = Math.max(monthlyCredit, monthlyDebit, 1);
  const creditPct = Math.round((monthlyCredit / max) * 100);
  const debitPct = Math.round((monthlyDebit / max) * 100);

  return (
    <div className="chart-placeholder flex flex-col justify-end p-4">
      <div className="flex items-end justify-center gap-6 h-full pb-1">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 sm:w-12 rounded-t-lg bg-red-200/80 transition-all duration-500" style={{ height: `${Math.max(creditPct, 8)}%` }} />
          <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Credit</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 sm:w-12 rounded-t-lg bg-emerald-200/80 transition-all duration-500" style={{ height: `${Math.max(debitPct, 8)}%` }} />
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Collected</span>
        </div>
      </div>
      <p className="text-[11px] text-center text-slate-500 mt-3">This month</p>
    </div>
  );
}

export default function DashboardPage({ customers, monthlySummary = { credit: 0, debit: 0 }, recentActivity = [], todayActivity: todayActivityProp = [], onNavigate, onAddCust, onOpenCustomer, shopInfo }) {
  const t = useLang();
  const ownerFirstName = (shopInfo?.ownerName || '').trim().split(' ')[0] || 'Shop Owner';
  const overdueAfterDays = Number.isFinite(Number(shopInfo?.markOverdueAfterDays)) ? Math.max(0, Number(shopInfo.markOverdueAfterDays)) : 7;
  const todayStr = new Date().toDateString();

  const stats = useMemo(() => {
    let due = 0;
    let advance = 0;
    let dueCount = 0;
    let settledCount = 0;

    customers.forEach(c => {
      if (c.balance > 0) { due += c.balance; dueCount++; }
      else if (c.balance < 0) advance += Math.abs(c.balance);
      else settledCount++;
    });
    return { due: Math.round(due), advance: Math.round(advance), dueCount, settledCount };
  }, [customers]);

  const recent = useMemo(() => {
    if (Array.isArray(recentActivity) && recentActivity.length > 0) {
      return recentActivity.slice(0, 8);
    }
    return customers
      .flatMap(c => (c.transactions || []).map(tx => ({ ...tx, cName: c.name, cId: c.id })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [customers, recentActivity]);

  const topDue = useMemo(
    () => [...customers]
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 6),
    [customers],
  );

  const todayActivity = useMemo(() => {
    if (Array.isArray(todayActivityProp) && todayActivityProp.length > 0) {
      return todayActivityProp.slice(0, 6);
    }
    return customers
      .filter(c => c.lastActivity && new Date(c.lastActivity).toDateString() === todayStr)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(0, 6);
  }, [customers, todayActivityProp, todayStr]);

  const monthCredit = Math.round(Number(monthlySummary?.credit) || 0);
  const monthDebit = Math.round(Number(monthlySummary?.debit) || 0);

  // Overdue = due balance older than markOverdueAfterDays (not "2 reminders sent")
  const overdueFocus = useMemo(() => customers
    .filter(c => c.balance > 0)
    .map(c => {
      const anchor = c.firstReminderAt || c.lastReminded || c.lastActivity;
      const overdueDays = Math.max(0, daysDiff(anchor) - overdueAfterDays);
      return { ...c, overdueDays };
    })
    .filter(c => c.overdueDays > 0)
    .sort((a, b) => b.overdueDays - a.overdueDays || b.balance - a.balance)
    .slice(0, 5), [customers, overdueAfterDays]);

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 overflow-y-auto pb-24 sm:pb-8">
      <PageHero
        compact
        eyebrow={dateLabel}
        title={`Hello, ${ownerFirstName}`}
        subtitle={`${t.dailyOverview} — ${shopInfo.shopName || 'Your shop'}`}
      />

      <div className="page-content fade-up-in pb-28 sm:pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <KpiCard label={t.totalDue} value={fmtCur(stats.due)} hint={`${stats.dueCount} ${t.customersPending}`} tone="due" icon={<Ico.Bell />} />
          <KpiCard label="Total advance" value={fmtCur(stats.advance)} hint="Customer credit balance" tone="advance" icon={<Ico.Check />} />
          <KpiCard label={t.totalCustomers} value={customers.length} hint="Registered accounts" tone="primary" icon={<Ico.Users />} />
          <KpiCard label={t.settled} value={stats.settledCount} hint="Zero balance" tone="neutral" icon={<Ico.Home />} />
        </div>

        <div>
          <p className="section-label mb-3">Quick actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: t.addCustomer, sub: 'Register new customer', onClick: onAddCust, icon: <Ico.Users />, chip: 'bg-primary-50 text-primary-600' },
              { title: t.addEntry, sub: t.pickCustomer, onClick: () => onNavigate('customers'), icon: <Ico.Plus />, chip: 'bg-sky-50 text-sky-600' },
              { title: t.reminders, sub: `${stats.dueCount} ${t.withDues}`, onClick: () => onNavigate('reminders'), icon: <Ico.Bell />, chip: 'bg-amber-50 text-amber-600' },
            ].map((a) => (
              <button key={a.title} type="button" onClick={a.onClick} className="card-action flex items-center gap-3 text-left">
                <div className={`icon-chip ${a.chip}`}>{a.icon}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
          <div className="xl:col-span-7 card-info">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-heading">{t.recentActivity}</h2>
              <button type="button" onClick={() => onNavigate('customers')} className="text-xs font-semibold text-primary-600 hover:text-primary-700 focus-ring rounded-lg px-2 py-1">{t.viewAll}</button>
            </div>
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-500">No recent entries yet</p>
                <p className="text-xs text-slate-500 mt-1">Open a customer ledger to add credit or debit</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-0.5">
                {recent.map(tx => (
                  <div key={tx.id} className={`rounded-xl border px-3.5 py-3 transition-colors ${tx.type === 'credit' ? 'border-red-100/80 bg-red-50/30' : 'border-emerald-100/80 bg-emerald-50/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`icon-chip-sm ${tx.type === 'credit' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {tx.type === 'credit' ? '↗' : '↙'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{tx.cName}</p>
                        <p className="text-xs text-slate-500 truncate">{tx.note || 'Transaction'} · {formatTime(tx.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>{tx.type === 'credit' ? '+' : '−'}{fmtCur(tx.amount)}</p>
                        <p className="text-[11px] text-slate-500">{formatDate(tx.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="xl:col-span-5 space-y-4 sm:space-y-5">
            <div className="card-info">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-heading">Top due customers</h2>
                <span className="badge badge-due">{topDue.length}</span>
              </div>
              {topDue.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">All customers settled</p>
              ) : (
                <div className="space-y-2">
                  {topDue.map(c => (
                    <button key={c.id} type="button" onClick={() => onOpenCustomer?.(c)} className="w-full flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-left transition-all hover:border-red-200 hover:bg-white focus-ring">
                      <CustomerAvatar name={c.name} balance={c.balance} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate">{c.phone || 'No phone'}</p>
                      </div>
                      <p className="text-sm font-bold text-red-600 shrink-0">{fmtCur(c.balance)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card-info">
              <h2 className="section-heading mb-3">Monthly collection</h2>
              <ChartPlaceholder monthlyCredit={monthCredit} monthlyDebit={monthDebit} />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-lg bg-red-50/60 border border-red-100 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500">Credit added</p>
                  <p className="text-sm font-bold text-red-700 mt-0.5">{fmtCur(monthCredit)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Collected</p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">{fmtCur(monthDebit)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <div className="card-warning">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-heading text-amber-800">Overdue focus</h2>
              <span className="badge badge-overdue">{overdueFocus.length} customers</span>
            </div>
            {overdueFocus.length === 0 ? (
              <p className="text-xs text-amber-600/80 py-6 text-center">No overdue customers right now</p>
            ) : (
              <div className="space-y-2">
                {overdueFocus.map(c => (
                  <button key={c.id} type="button" onClick={() => onOpenCustomer?.(c)} className="w-full flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-3 py-2.5 text-left transition-all hover:border-amber-200 focus-ring">
                    <CustomerAvatar name={c.name} balance={c.balance} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-amber-700/80">{c.overdueDays}d overdue · {c.reminderCount || 0} reminders</p>
                    </div>
                    <p className="text-sm font-bold text-red-600 shrink-0">{fmtCur(c.balance)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card-info">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-heading">Today&apos;s activity</h2>
              <span className="badge badge-neutral">{todayActivity.length}</span>
            </div>
            {todayActivity.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No customer activity today</p>
            ) : (
              <div className="space-y-2">
                {todayActivity.slice(0, 6).map(c => (
                  <button key={c.id} type="button" onClick={() => onOpenCustomer?.(c)} className="w-full flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 text-left transition-all hover:bg-slate-50 focus-ring">
                    <CustomerAvatar name={c.name} balance={c.balance} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">Updated {formatTime(c.lastActivity)}</p>
                    </div>
                    <span className={`badge ${c.balance > 0 ? 'badge-due' : c.balance < 0 ? 'badge-advance' : 'badge-settled'}`}>
                      {c.balance > 0 ? t.due : c.balance < 0 ? t.advance : t.clear}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
