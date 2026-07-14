import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Ico from '../utils/icons.jsx';
import PageHero from '../components/PageHero.jsx';
import SearchInput from '../components/SearchInput.jsx';
import CustomerAvatar from '../components/CustomerAvatar.jsx';
import ConfirmToast from '../components/ConfirmToast.jsx';
import { fmtCur, formatDate } from '../utils/data.js';
import { useLang } from '../context/lang.jsx';

function balanceBadge(balance, t) {
  if (balance > 0) return { label: t.due, className: 'badge-due' };
  if (balance < 0) return { label: t.advance, className: 'badge-advance' };
  return { label: t.clear, className: 'badge-settled' };
}

function lastTxnLabel(customer) {
  const tx = (customer.transactions || []).at(-1);
  if (tx) {
    const prefix = tx.type === 'credit' ? 'Credit' : 'Payment';
    return `${prefix} · ${formatDate(tx.date)}`;
  }
  if (customer.lastActivity) return `Active · ${formatDate(customer.lastActivity)}`;
  return 'No activity yet';
}

function buildDeleteConfirm(selected) {
  const dueCount = selected.filter(c => c.balance > 0).length;
  const advanceCount = selected.filter(c => c.balance < 0).length;
  const settledCount = selected.filter(c => c.balance === 0).length;
  const dueTotal = selected.filter(c => c.balance > 0).reduce((s, c) => s + c.balance, 0);
  const advanceTotal = selected.filter(c => c.balance < 0).reduce((s, c) => s + Math.abs(c.balance), 0);

  const title = selected.length === 1
    ? `Delete ${selected[0].name}?`
    : `Delete ${selected.length} customers?`;

  const parts = [];
  if (dueCount > 0) {
    parts.push(`${dueCount} with due (${fmtCur(dueTotal)})`);
  }
  if (advanceCount > 0) {
    parts.push(`${advanceCount} with advance (${fmtCur(advanceTotal)})`);
  }
  if (settledCount > 0) {
    parts.push(`${settledCount} settled`);
  }

  let message;
  if (dueCount > 0 || advanceCount > 0) {
    message = `Some selected accounts are not clear (${parts.join(', ')}). Deleting will permanently remove their ledger history. Are you sure you want to delete?`;
  } else {
    message = `This will permanently remove ${selected.length === 1 ? 'this customer and their' : 'these customers and their'} ledger history. This cannot be undone.`;
  }

  return { title, message };
}

export default function CustomerListPage({ customers, onSelect, onAddCust, onDeleteCustomers }) {
  const t = useLang();
  const [q, setQ] = useState('');
  const [filter, setFilt] = useState('all');
  const [showFab, setShowFab] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  const filterOptions = [
    ['all', t.all],
    ['due', t.due],
    ['clear', t.advance],
    ['settled', t.settled],
  ];
  const activeIndex = Math.max(0, filterOptions.findIndex(([v]) => v === filter));

  const filtered = useMemo(() => {
    let list = customers;
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(lq) || c.phone.includes(q));
    }
    if (filter === 'due') list = list.filter(c => c.balance > 0);
    if (filter === 'clear') list = list.filter(c => c.balance < 0);
    if (filter === 'settled') list = list.filter(c => c.balance === 0);
    return list;
  }, [customers, q, filter]);

  const selectedCustomers = useMemo(
    () => customers.filter(c => selectedIds.includes(c.id)),
    [customers, selectedIds],
  );

  const onSearch = useCallback(e => { setQ(e.target.value); }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const onScroll = () => {
      const currentScrollTop = node.scrollTop;
      const delta = currentScrollTop - lastScrollTopRef.current;
      if (Math.abs(delta) < 12) return;
      if (currentScrollTop <= 24) setShowFab(true);
      else if (delta > 0) setShowFab(false);
      else setShowFab(true);
      lastScrollTopRef.current = currentScrollTop;
    };

    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, []);

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setConfirmOpen(false);
  };

  const toggleSelectMode = () => {
    if (selectMode) exitSelectMode();
    else {
      setSelectMode(true);
      setSelectedIds([]);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAllFiltered = () => setSelectedIds(filtered.map(c => c.id));
  const clearSelected = () => setSelectedIds([]);

  const requestDelete = () => {
    if (!selectedCustomers.length) return;
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCustomers.length || deleting) return;
    setDeleting(true);
    try {
      await onDeleteCustomers?.(selectedCustomers.map(c => c.id));
      exitSelectMode();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const confirmCopy = buildDeleteConfirm(selectedCustomers);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <PageHero
          compact
          title={t.customers}
          subtitle="Manage customer ledgers, dues, and payments"
          badge={`${filtered.length}`}
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchInput id="customer-search" value={q} onChange={onSearch} placeholder={t.search} />
            </div>
            <button
              type="button"
              onClick={toggleSelectMode}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 min-h-10 text-xs font-semibold transition-colors focus-ring ${
                selectMode
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              aria-pressed={selectMode}
            >
              <Ico.Trash className="w-3.5 h-3.5" />
              {selectMode ? 'Cancel' : 'Delete'}
            </button>
          </div>
        </PageHero>

        <div className="page-shell pt-3 pb-3 sm:pt-3.5 sm:pb-3.5 space-y-2.5">
          <div className="flex justify-center">
            <div className="segmented grid-cols-4 w-full sm:max-w-lg">
              <span
                className="segmented-thumb"
                style={{
                  left: `calc(${activeIndex} * 25% + 0.25rem)`,
                  width: 'calc(25% - 0.5rem)',
                }}
              />
              {filterOptions.map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilt(v)}
                  aria-pressed={filter === v}
                  className={`segmented-btn focus-ring ${filter === v ? 'is-active' : 'hover:text-slate-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {selectMode && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/70 px-2.5 py-2 sm:px-4">
              <p className="text-xs sm:text-sm font-semibold text-red-700 shrink-0">
                {selectedIds.length} selected
              </p>
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  disabled={selectedIds.length === filtered.length || filtered.length === 0}
                  className="btn-secondary btn-sm border-red-200 text-red-700 hover:bg-white disabled:opacity-50"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearSelected}
                  disabled={!selectedIds.length}
                  className="btn-secondary btn-sm border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={requestDelete}
                  disabled={!selectedIds.length || deleting}
                  className="btn btn-sm !bg-red-600 hover:!bg-red-700 shrink-0 disabled:opacity-50"
                >
                  <Ico.Trash className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 pb-36 text-slate-500 page-shell">
            <div className="icon-chip bg-slate-100 text-slate-500 mb-3 ring-1 ring-slate-200/80"><Ico.Users /></div>
            <p className="font-semibold text-sm text-slate-600">{t.noCustomers}</p>
            <p className="text-xs mt-1 text-slate-500">Try a different search or filter</p>
          </div>
        ) : (
          <div className="page-shell py-3 sm:py-5 pb-28 sm:pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-4">
            {filtered.map(c => {
              const badge = balanceBadge(c.balance, t);
              const borderTone = c.balance > 0 ? 'border-red-100 hover:border-red-200' : c.balance < 0 ? 'border-emerald-100 hover:border-emerald-200' : 'border-slate-200 hover:border-slate-300';
              const isSelected = selectedIds.includes(c.id);

              return (
                <article
                  key={c.id}
                  role={selectMode ? undefined : 'button'}
                  tabIndex={selectMode ? undefined : 0}
                  onClick={() => {
                    if (selectMode) toggleSelected(c.id);
                    else onSelect(c);
                  }}
                  onKeyDown={(e) => {
                    if (selectMode) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(c);
                    }
                  }}
                  className={`customer-card group text-left w-full ${borderTone} ${isSelected ? 'ring-2 ring-red-400/50 border-red-300' : ''} ${selectMode ? 'cursor-pointer' : ''}`}
                  aria-label={selectMode ? `Select ${c.name}` : `Open ledger for ${c.name}`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {selectMode && (
                      <label
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border cursor-pointer transition-colors ${isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-slate-300 bg-white hover:border-red-400'}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelected(c.id)}
                          className="sr-only"
                          aria-label={`Select ${c.name}`}
                        />
                      </label>
                    )}

                    <CustomerAvatar name={c.name} balance={c.balance} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm sm:text-[0.9375rem] text-slate-900 truncate">{c.name}</p>
                        <span className={`badge shrink-0 ${badge.className}`}>{badge.label}</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                        <Ico.Phone />
                        {c.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500">Outstanding</p>
                      <p className={`amount-lg mt-0.5 ${c.balance > 0 ? 'text-red-600' : c.balance < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {c.balance === 0 ? '—' : fmtCur(c.balance)}
                      </p>
                    </div>
                    <div className="text-right min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-500">Last entry</p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate max-w-[6.5rem] sm:max-w-[7.5rem]">{lastTxnLabel(c)}</p>
                    </div>
                  </div>

                  {!selectMode && (
                    <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 group-hover:text-primary-600 transition-colors">View ledger</span>
                      <span className="text-primary-500 group-hover:translate-x-0.5 transition-transform"><Ico.Chev /></span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!selectMode && (
        <button
          type="button"
          onClick={onAddCust}
          className={`hidden sm:flex fixed bottom-6 left-1/2 z-30 -translate-x-1/2 items-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition-all duration-300 hover:bg-primary-700 hover:shadow-xl active:scale-95 focus-ring ${showFab ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-label={t.newCustomer}
        >
          <Ico.Plus />
          <span>{t.newCustomer}</span>
        </button>
      )}

      <ConfirmToast
        open={confirmOpen}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => !deleting && setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
