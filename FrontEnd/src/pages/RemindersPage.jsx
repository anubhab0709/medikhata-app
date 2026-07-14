import { useMemo, useState, useCallback } from 'react';
import Ico from '../utils/icons.jsx';
import PageHero from '../components/PageHero.jsx';
import SearchInput from '../components/SearchInput.jsx';
import CustomerAvatar from '../components/CustomerAvatar.jsx';
import { fmtCur, daysDiff } from '../utils/data.js';
import { useLang, buildReminderMessage, DEFAULT_MESSAGE_EN, DEFAULT_MESSAGE_BN, fillReminderTemplate } from '../context/lang.jsx';

function PaperPlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function reminderStatus(days, t) {
  if (days === null) return { label: t.neverReminded, badge: 'badge-settled', tone: 'text-slate-500' };
  if (days === 0) return { label: `✓ ${t.today}`, badge: 'badge-sent', tone: 'text-primary-600' };
  if (days <= 3) return { label: `${days} ${t.daysAgo}`, badge: 'badge-overdue', tone: 'text-amber-600' };
  return { label: `${days} ${t.daysAgo}`, badge: 'badge-overdue', tone: 'text-orange-600' };
}

function urgencyTone(balance) {
  if (balance > 5000) return { card: 'border-red-200/80 hover:border-red-300', amount: 'text-red-600', overdue: 'text-red-600' };
  if (balance > 2000) return { card: 'border-amber-200/80 hover:border-amber-300', amount: 'text-amber-700', overdue: 'text-amber-700' };
  return { card: 'border-slate-200 hover:border-slate-300', amount: 'text-slate-800', overdue: 'text-slate-600' };
}

export default function RemindersPage({ customers, shopInfo, onOpenReminder, onSendSelectedReminders }) {
  const t = useLang();
  const [sort, setSort] = useState('due');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMsgLang, setBulkMsgLang] = useState(() => (
    shopInfo?.defaultTemplateLang === 'en' || shopInfo?.messageLanguage === 'en' ? 'en' : 'bn'
  ));
  const [bulkUseCustom, setBulkUseCustom] = useState(false);
  const [bulkCustomMsg, setBulkCustomMsg] = useState(() => shopInfo?.messageEn || DEFAULT_MESSAGE_EN);

  const sortOptions = [
    ['due', 'Amount', t.sortByDue],
    ['name', 'Name', t.sortByName],
    ['date', 'Date', t.sortByDate],
  ];
  const activeSortIndex = Math.max(0, sortOptions.findIndex(([v]) => v === sort));

  const dueCustomers = useMemo(() => {
    let list = customers.filter(c => c.balance > 0);
    if (search) {
      const lq = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(lq) || c.phone.includes(search));
    }
    if (sort === 'due') return [...list].sort((a, b) => b.balance - a.balance);
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'date') return [...list].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    return list;
  }, [customers, sort, search]);

  const totalDue = useMemo(() => dueCustomers.reduce((s, c) => s + c.balance, 0), [dueCustomers]);
  const remindedToday = useMemo(() => customers.filter(c => c.balance > 0 && c.lastReminded && daysDiff(c.lastReminded) === 0).length, [customers]);
  const selectedCustomers = useMemo(() => dueCustomers.filter(c => selectedIds.includes(c.id)), [dueCustomers, selectedIds]);

  const buildBulkMessage = useCallback((customer) => {
    if (!customer) return '';
    if (!bulkUseCustom) {
      return buildReminderMessage({
        lang: bulkMsgLang,
        shopInfo,
        t,
        name: customer.name,
        amount: customer.balance,
      });
    }
    const amount = `₹${Math.abs(Math.round(customer.balance)).toLocaleString('en-IN')}`;
    return fillReminderTemplate(bulkCustomMsg, {
      name: customer.name,
      amount,
      shop: shopInfo?.shopName || '',
      owner: shopInfo?.ownerName || '',
      phone: shopInfo?.shopPhone || '',
    });
  }, [bulkUseCustom, bulkCustomMsg, bulkMsgLang, shopInfo, t]);

  const bulkPreviewCustomers = useMemo(() => selectedCustomers.map(customer => ({
    customer,
    message: buildBulkMessage(customer),
  })), [selectedCustomers, buildBulkMessage]);

  const toggleSelected = id => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const sendSelected = () => {
    if (!selectedCustomers.length) return;
    onSendSelectedReminders?.(selectedCustomers);
    setSelectedIds([]);
    setShowBulkModal(false);
  };

  const selectAllDue = () => setSelectedIds(dueCustomers.map(c => c.id));
  const deselectAllDue = () => setSelectedIds([]);

  const openBulkModal = () => {
    const lang = shopInfo?.defaultTemplateLang === 'en' || shopInfo?.messageLanguage === 'en' ? 'en' : 'bn';
    setBulkMsgLang(lang);
    setBulkUseCustom(false);
    setBulkCustomMsg(
      lang === 'bn'
        ? (shopInfo?.messageBn || DEFAULT_MESSAGE_BN)
        : (shopInfo?.messageEn || DEFAULT_MESSAGE_EN)
    );
    setShowBulkModal(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <PageHero
          compact
          title={t.reminders}
          subtitle="Follow up on outstanding dues and send payment reminders"
          badge={`${dueCustomers.length} due`}
        >
          <SearchInput id="reminder-search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} />
        </PageHero>

        <div className="page-shell pt-3 pb-3 sm:pt-3.5 sm:pb-3.5 space-y-2.5 sm:space-y-3">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Due', full: t.allDueCustomers, val: dueCustomers.length, tone: 'primary' },
              { label: 'Total', full: t.totalDue, val: fmtCur(totalDue), tone: 'due' },
              { label: 'Today', full: 'Sent today', val: remindedToday, tone: 'amber' },
            ].map(s => (
              <div key={s.label} className={`card-kpi-accent card-kpi-accent--${s.tone} border-slate-200/80 text-center sm:text-left`}>
                <p className="section-label truncate">
                  <span className="sm:hidden">{s.label}</span>
                  <span className="hidden sm:inline">{s.full}</span>
                </p>
                <p className={`kpi-value ${s.tone === 'due' ? 'text-red-600' : 'text-slate-900'}`}>{s.val}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="segmented grid-cols-3 w-full sm:max-w-md">
              <span
                className="segmented-thumb"
                style={{
                  left: `calc(${activeSortIndex} * 33.3333% + 0.25rem)`,
                  width: 'calc(33.3333% - 0.5rem)',
                }}
              />
              {sortOptions.map(([v, short, full]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSort(v)}
                  aria-pressed={sort === v}
                  className={`segmented-btn focus-ring ${sort === v ? 'is-active' : 'hover:text-slate-700'}`}
                >
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{full}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedCustomers.length > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50/60 px-2.5 py-2 sm:px-4 sm:py-2.5">
              <p className="text-xs sm:text-sm font-semibold text-primary-700 shrink-0">{selectedCustomers.length} selected</p>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <button
                  type="button"
                  onClick={selectAllDue}
                  disabled={selectedCustomers.length === dueCustomers.length}
                  className="btn-secondary btn-sm border-primary-200 text-primary-700 hover:bg-white disabled:opacity-50"
                >
                  Select all
                </button>
                <button type="button" onClick={deselectAllDue} className="btn-secondary btn-sm border-slate-200 text-slate-600 hover:bg-white">
                  Clear
                </button>
                <button type="button" onClick={openBulkModal} className="btn btn-sm shrink-0">
                  <PaperPlaneIcon /> Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 sm:pb-8">
        {dueCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500 page-shell">
            <div className="icon-chip bg-emerald-50 text-emerald-600 mb-3 ring-1 ring-emerald-100"><Ico.Check /></div>
            <p className="font-semibold text-sm text-slate-600">{t.noDueCustomers}</p>
            <p className="text-xs mt-1 text-slate-500">{t.noDueDesc}</p>
          </div>
        ) : (
          <div className="page-shell py-3 sm:py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
            {dueCustomers.map(c => {
              const days = c.lastReminded ? daysDiff(c.lastReminded) : null;
              const status = reminderStatus(days, t);
              const tone = urgencyTone(c.balance);
              const sentToday = days === 0;
              const isSelected = selectedIds.includes(c.id);
              const overdueDays = c.firstReminderAt || c.lastReminded
                ? Math.max(0, daysDiff(c.firstReminderAt || c.lastReminded) - (Number(shopInfo?.markOverdueAfterDays) || 7))
                : null;

              return (
                <article
                  key={c.id}
                  onClick={() => onOpenReminder(c)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenReminder(c); } }}
                  role="button"
                  tabIndex={0}
                  className={`customer-card ${tone.card} ${isSelected ? 'ring-2 ring-primary-500/40 border-primary-300' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <label
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary-500/40 ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white hover:border-primary-400'}`}
                      onClick={e => e.stopPropagation()}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(c.id)} className="sr-only" aria-label={`Select ${c.name}`} />
                    </label>

                    <CustomerAvatar name={c.name} balance={c.balance} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-slate-900 truncate">{c.name}</p>
                        <span className={`badge shrink-0 ${status.badge}`}>{status.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{c.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Amount due</p>
                      <p className={`amount-lg mt-0.5 ${tone.amount}`}>{fmtCur(c.balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Overdue</p>
                      <p className={`text-xs font-semibold mt-0.5 ${overdueDays && overdueDays > 0 ? tone.overdue : 'text-slate-500'}`}>
                        {overdueDays && overdueDays > 0 ? `${overdueDays}d` : 'On track'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <p className={`text-[11px] font-medium truncate ${status.tone}`}>
                      {(c.reminderCount || 0) > 0 ? `${c.reminderCount} sent` : 'Not reminded'}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenReminder(c); }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 min-h-10 h-10 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 focus-ring ${sentToday ? 'bg-slate-700' : 'bg-primary-600'}`}
                      aria-label={sentToday ? `Resend reminder to ${c.name}` : `Send reminder to ${c.name}`}
                    >
                      <PaperPlaneIcon />
                      {sentToday ? 'Resend' : 'Remind'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {showBulkModal && selectedCustomers.length > 0 && (
        <div className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBulkModal(false)} aria-hidden="true" />
          <div className="modal-panel relative w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden safe-area-pb" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="bulk-reminder-title">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100">
              <div>
                <p className="section-label text-primary-600">Bulk reminder</p>
                <h2 id="bulk-reminder-title" className="section-heading mt-0.5">{selectedCustomers.length} customers selected</h2>
              </div>
              <button type="button" onClick={() => setShowBulkModal(false)} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors focus-ring" aria-label="Close">
                <Ico.X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
              <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 overflow-y-auto px-4 py-4 space-y-2 max-h-[35vh] md:max-h-full">
                {selectedCustomers.map(c => {
                  const days = c.lastReminded ? daysDiff(c.lastReminded) : null;
                  const lastReminder = days === null ? t.neverReminded : days === 0 ? `✓ ${t.today}` : `${days} ${t.daysAgo}`;
                  return (
                    <div key={c.id} className="card px-3 py-3 border-primary-200/60">
                      <div className="flex items-center gap-2.5">
                        <CustomerAvatar name={c.name} balance={c.balance} size="sm" />
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{c.phone}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm text-red-600">{fmtCur(c.balance)}</p>
                            <p className="text-[9px] mt-0.5 font-medium uppercase tracking-wider text-slate-500">{lastReminder}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="md:col-span-7 bg-white px-5 py-5 overflow-y-auto max-h-[45vh] md:max-h-full">
                <div className="space-y-5">
                  <div className="card-due flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="section-label text-red-600">{t.totalDue}</p>
                      <p className="text-xl font-bold text-red-700 mt-0.5">{fmtCur(selectedCustomers.reduce((sum, customer) => sum + customer.balance, 0))}</p>
                    </div>
                    <span className="badge badge-due">{selectedCustomers.length} customers</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setBulkUseCustom(false)} className={`flex-1 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all focus-ring ${!bulkUseCustom ? 'border-primary-200 text-primary-700 bg-primary-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.useTemplate}</button>
                    <button type="button" onClick={() => { setBulkUseCustom(true); if (!bulkCustomMsg) setBulkCustomMsg(bulkMsgLang === 'bn' ? (shopInfo?.messageBn || DEFAULT_MESSAGE_BN) : (shopInfo?.messageEn || DEFAULT_MESSAGE_EN)); }} className={`flex-1 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all focus-ring ${bulkUseCustom ? 'border-primary-200 text-primary-700 bg-primary-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t.customMessage}</button>
                  </div>

                  <div>
                    <label className="label">{t.messageLanguage}</label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                      <button type="button" onClick={() => setBulkMsgLang('bn')} className={`py-2 rounded-lg text-xs font-semibold transition-all focus-ring ${bulkMsgLang === 'bn' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>{t.bengali}</button>
                      <button type="button" onClick={() => setBulkMsgLang('en')} className={`py-2 rounded-lg text-xs font-semibold transition-all focus-ring ${bulkMsgLang === 'en' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>{t.english}</button>
                    </div>
                  </div>

                  <div>
                    <label className="label">{t.messagePreview}</label>
                    {bulkUseCustom ? (
                      <textarea value={bulkCustomMsg} onChange={e => setBulkCustomMsg(e.target.value)} rows={7} className="input resize-none py-3 leading-relaxed bg-primary-50/50 border-primary-200 focus:border-primary-400 text-xs" />
                    ) : (
                      <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                        {bulkPreviewCustomers.length > 0 ? bulkPreviewCustomers.map(({ customer, message }) => (
                          <div key={customer.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-900 truncate">{customer.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{fmtCur(customer.balance)} · {customer.phone}</p>
                              </div>
                              <span className="badge badge-sent">Preview</span>
                            </div>
                            <div className="text-[11px] font-medium leading-relaxed whitespace-pre-line text-slate-700">{message}</div>
                          </div>
                        )) : (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500 flex items-center justify-center min-h-[100px]">Select customers to preview.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={sendSelected} className="btn w-full">
                    <PaperPlaneIcon /> Send reminders
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
