import { useState, useMemo, useRef } from 'react';
import Ico from '../utils/icons.jsx';
import AddTxnModal from '../components/AddTxnModal.jsx';
import { fmtCur, formatDate, formatTime } from '../utils/data.js';
import { downloadCustomerLedgerPdf, openBillOnWhatsApp } from '../utils/billExport.js';
import { useLang } from '../context/lang.jsx';
import { REMINDERS_FEATURE_ENABLED } from '../config/features.js';

function PaperPlaneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

export default function LedgerPage({ customer, shopInfo, onBack, onAddTxn, onEditTxn, onDeleteTxn, onDeleteCustomer, onOpenReminder }) {
  const t = useLang();
  const [modalType, setModalType] = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  const [viewTxn, setViewTxn] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showBillSheet, setShowBillSheet] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [billToast, setBillToast] = useState('');
  const [showMobileActions, setShowMobileActions] = useState(true);
  const lastScrollTop = useRef(0);
  const txnsByMonth = useMemo(() => {
    const sorted = [...customer.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const grouped = new Map();

    sorted.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          txns: [],
        });
      }
      grouped.get(key).txns.push(tx);
    });

    return Array.from(grouped.values());
  }, [customer.transactions]);
  const bal = customer.balance;
  const isOwed = bal > 0;

  const handleBillDownload = async () => {
    setShowBillSheet(false);
    setShowHeaderMenu(false);

    try {
      const result = await downloadCustomerLedgerPdf(customer, shopInfo);
      if (result?.method === 'save-picker') setBillToast('Choose where to save your PDF');
      else if (result?.method === 'download') setBillToast('Bill PDF downloading');
      else if (result?.method === 'share') setBillToast('Save the PDF from your phone share sheet');
      else setBillToast('Bill PDF opened for saving');
    } catch {
      setBillToast('Unable to generate bill PDF');
    }

    window.setTimeout(() => setBillToast(''), 2600);
  };

  const handleBillWhatsApp = () => {
    openBillOnWhatsApp(customer, shopInfo);
    setShowBillSheet(false);
    setShowHeaderMenu(false);
    setBillToast('Opening WhatsApp bill share');
    window.setTimeout(() => setBillToast(''), 2200);
  };

  const handleSettle = () => {
    if (bal === 0) return;
    const amount = Math.abs(Math.round(bal));
    const type = bal > 0 ? 'debit' : 'credit';
    const now = new Date().toISOString();

    onAddTxn(customer.id, {
      id: Date.now(),
      type,
      amount,
      note: 'Account settled',
      date: now,
      balance: 0,
    });

    setShowSettleModal(false);
  };

  const handleLedgerScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    const delta = top - lastScrollTop.current;

    if (top <= 12) {
      setShowMobileActions(true);
    } else if (delta > 8) {
      setShowMobileActions(false);
    } else if (delta < -8) {
      setShowMobileActions(true);
    }

    lastScrollTop.current = top;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        {showHeaderMenu && (
          <button
            type="button"
            className="fixed inset-0 z-10 bg-slate-900/20 backdrop-blur-sm sm:hidden"
            onClick={() => setShowHeaderMenu(false)}
            aria-label="Close actions menu"
          />
        )}
        <div className="relative flex items-center justify-center px-4 py-3">
          <button type="button" onClick={onBack} className="absolute left-4 p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" aria-label="Back">
            <Ico.Back />
          </button>
          <div className="min-w-0 max-w-[65%] sm:max-w-md text-center">
            <h1 className="font-bold text-slate-900 text-sm truncate tracking-tight">{customer.name}</h1>
            <div className="flex items-center justify-center gap-1.5 text-slate-500 mt-0.5 font-medium text-[11px]">
              <Ico.Phone className="w-3 h-3" /><span>{customer.phone}</span>
            </div>
          </div>
          <div className="absolute right-4 z-20 flex items-center gap-2 flex-shrink-0">
            <div className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setShowHeaderMenu(prev => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
                title="More actions"
                aria-label="Open more actions"
              >
                <Ico.More />
              </button>

              {showHeaderMenu && (
                <div className="absolute right-0 top-10 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg fade-up-in">
                  <a
                    href={`tel:${customer.phone.replace(/\s+/g, '')}`}
                    onClick={() => setShowHeaderMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Ico.Phone className="w-4 h-4" /> Call Customer
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setShowBillSheet(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                  >
                    <Ico.Bill className="w-4 h-4" /> Generate Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      const ok = window.confirm('Delete this customer?');
                      if (ok) onDeleteCustomer(customer.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Ico.Trash className="w-4 h-4" /> Delete Customer
                  </button>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <a
                href={`tel:${customer.phone.replace(/\s+/g, '')}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
                title="Call"
                aria-label="Call customer"
              >
                <Ico.Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setShowBillSheet(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50 transition-all"
                title="Bill"
                aria-label="Open bill actions"
              >
                <Ico.Bill className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm('Delete this customer?');
                  if (ok) onDeleteCustomer(customer.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-all"
                title="Delete"
                aria-label="Delete customer"
              >
                <Ico.Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className={`mx-4 mb-3 p-3.5 sm:p-4 rounded-xl flex items-center justify-between border ${isOwed ? 'bg-red-50 border-red-100' : bal === 0 ? 'bg-white border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isOwed ? 'text-red-600' : bal === 0 ? 'text-slate-500' : 'text-primary-600'}`}>
              {isOwed ? t.totalDueLabel : bal === 0 ? t.accountSettled : t.advanceBalance}
            </p>
            <p className={`text-2xl font-bold mt-1 leading-none tracking-tight ${isOwed ? 'text-red-600' : bal === 0 ? 'text-slate-900' : 'text-primary-700'}`}>{fmtCur(bal)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {REMINDERS_FEATURE_ENABLED && isOwed && (
              <button
                type="button"
                onClick={() => onOpenReminder(customer)}
                className="inline-flex w-24 sm:w-28 items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 px-2 py-1.5 text-[11px] font-semibold transition-all hover:bg-slate-50 active:scale-95"
              >
                <PaperPlaneIcon /> Reminder
              </button>
            )}

            {bal !== 0 && (
              <button
                type="button"
                onClick={() => setShowSettleModal(true)}
                className="inline-flex w-24 sm:w-28 items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 px-2 py-1.5 text-[11px] font-semibold transition-all hover:bg-slate-50 active:scale-95"
              >
                <Ico.Check className="w-3 h-3" /> Settle Now
              </button>
            )}

            {bal === 0 && (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                <Ico.Check className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      <div onScroll={handleLedgerScroll} className="flex-1 overflow-y-auto page-shell py-3 space-y-3 pb-4">
        {txnsByMonth.length === 0 ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-500 border border-slate-200">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <p className="font-bold text-sm text-slate-700">{t.noTransactions}</p>
            <p className="text-xs font-medium mt-1.5 max-w-[220px] text-slate-500">{t.firstEntry}</p>
          </div>
        ) : txnsByMonth.map(group => (
          <div key={group.label} className="space-y-2 sm:space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1 pt-1 flex items-center gap-2">
              <span>{group.label}</span>
              <span className="h-px flex-1 bg-slate-200" />
            </p>
            {group.txns.map(tx => (
              <button
                type="button"
                key={tx.id}
                onClick={() => setViewTxn(tx)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-3 sm:px-4 sm:py-3.5 shadow-sm cursor-pointer hover:border-slate-300 hover:shadow transition-all duration-150 focus-ring"
              >
                <div className="flex items-start justify-between gap-2 sm:hidden">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {tx.type === 'credit' ? <Ico.Credit className="w-4 h-4" /> : <Ico.Debit className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 leading-tight">{tx.type === 'credit' ? t.creditAdded : t.paymentRecorded}</p>
                      {tx.note && <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-tight truncate max-w-[120px]">{tx.note}</p>}
                      <p className="text-[9px] font-medium text-slate-500 mt-1 leading-tight">{formatDate(tx.date)} · {formatTime(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[70px]">
                    <p className={`font-semibold text-sm ${tx.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>{tx.type === 'credit' ? '−' : '+'}{fmtCur(tx.amount)}</p>
                    <p className="text-[10px] mt-0.5 font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded inline-block">{fmtCur(tx.balance)}</p>
                  </div>
                </div>
                <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {tx.type === 'credit' ? <Ico.Credit className="w-5 h-5" /> : <Ico.Debit className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{tx.type === 'credit' ? t.creditAdded : t.paymentRecorded}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] font-medium text-slate-500">{formatDate(tx.date)} · {formatTime(tx.date)}</p>
                        {tx.note && <p className="text-xs font-medium text-slate-500 truncate max-w-[180px]">· {tx.note}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 min-w-[100px]">
                    <p className={`font-semibold text-lg leading-none ${tx.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>{tx.type === 'credit' ? '−' : '+'}{fmtCur(tx.amount)}</p>
                    <p className="text-[11px] mt-1 font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg inline-block border border-slate-100">{fmtCur(tx.balance)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        className={`shrink-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 transition-transform duration-300 sm:px-6 ${
          showMobileActions ? 'translate-y-0' : 'translate-y-[110%] sm:translate-y-0'
        } pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:pb-4`}
      >
        <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto sm:max-w-lg">
          <button
            type="button"
            onClick={() => setModalType('credit')}
            className="w-full h-11 rounded-xl font-semibold text-red-600 text-sm bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 border border-red-200"
          >
            <Ico.Credit className="w-4 h-4" /> Add Credit
          </button>
          <button
            type="button"
            onClick={() => setModalType('debit')}
            className="w-full h-11 rounded-xl font-semibold text-emerald-600 text-sm bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 border border-emerald-200"
          >
            <Ico.Debit className="w-4 h-4" /> Add Debit
          </button>
        </div>
      </div>

      {billToast && (
        <div className="fixed bottom-32 left-1/2 z-[60] -translate-x-1/2 px-4 w-full max-w-xs">
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-white p-2.5 shadow-lg bulk-toast-enter">
            <div className="bulk-toast-check flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Ico.Bill className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Bill Action</p>
              <p className="text-[10px] font-medium text-gray-500 mt-0.5">{billToast}</p>
            </div>
          </div>
        </div>
      )}

      {viewTxn && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewTxn(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Entry Details</h3>
              <button onClick={() => setViewTxn(null)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><Ico.X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-0.5">{formatDate(viewTxn.date)} · {formatTime(viewTxn.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-lg font-bold ${viewTxn.type === 'credit' ? 'text-red-600' : 'text-primary-600'}`}>
                    {viewTxn.type === 'credit' ? '−' : '+'}{fmtCur(viewTxn.amount)}
                  </p>
                  <p className="text-[10px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded inline-block mt-1">{fmtCur(viewTxn.balance)}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 px-4 py-3 bg-gray-50">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-1">Entry Type</p>
                <p className="text-sm font-semibold text-gray-900">{viewTxn.type === 'credit' ? t.creditAdded : t.paymentRecorded}</p>
                {viewTxn.note && <p className="text-xs font-medium text-gray-600 mt-2">{viewTxn.note}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditTxn(viewTxn);
                    setModalType(viewTxn.type);
                    setViewTxn(null);
                  }}
                  className="btn-secondary"
                >
                  <Ico.Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    const ok = window.confirm('Delete this entry?');
                    if (ok) {
                      onDeleteTxn(customer.id, viewTxn.id);
                      setViewTxn(null);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 border border-red-200 bg-white text-red-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-50 active:scale-[0.98] transition-all"
                >
                  <Ico.Trash className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBillSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowBillSheet(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider mb-0.5">Customer Bill</p>
                <h3 className="text-sm font-semibold text-gray-900">Share or download bill</h3>
              </div>
              <button onClick={() => setShowBillSheet(false)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><Ico.X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Summary</p>
                <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                <p className="text-xs font-medium text-gray-600"><span className="font-semibold text-gray-800">{fmtCur(customer.balance)}</span> balance</p>
              </div>

              <button
                onClick={handleBillWhatsApp}
                className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-all hover:bg-emerald-100 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Ico.WA className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Send to WhatsApp</p>
                    <p className="text-[10px] font-medium text-gray-600 mt-0.5">Opens WhatsApp with bill summary</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleBillDownload}
                className="w-full rounded-lg border border-blue-200 bg-sky-50 px-4 py-3 text-left transition-all hover:bg-sky-100 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Ico.Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">Download PDF</p>
                    <p className="text-[10px] font-medium text-gray-600 mt-0.5">Saves a full ledger PDF</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowSettleModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Settlement</p>
                <h3 className="text-sm font-semibold text-gray-900">Settle {customer.name}</h3>
              </div>
              <button onClick={() => setShowSettleModal(false)} className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"><Ico.X className="w-4 h-4" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className={`rounded-lg border px-4 py-3 ${bal > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider ${bal > 0 ? 'text-red-600' : 'text-gray-500'}`}>{bal > 0 ? 'Total Due' : 'Advance Balance'}</p>
                <p className={`text-xl font-bold mt-0.5 ${bal > 0 ? 'text-red-700' : 'text-gray-800'}`}>{fmtCur(bal)}</p>
              </div>

              <div className="rounded-lg border border-gray-200 px-4 py-3 bg-gray-50">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-0.5">Settlement Entry</p>
                <p className="text-xs font-semibold text-gray-900">{bal > 0 ? 'Full Payment Received' : 'Credit (Due Added)'}</p>
                <p className="text-[11px] font-medium text-gray-600 mt-1 leading-relaxed">A balancing entry will be created and final balance will become <span className="font-semibold text-gray-900">₹0</span>.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => setShowSettleModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSettle} className="btn">
                  <Ico.Check className="w-4 h-4" /> Settle All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(modalType || editTxn) && <AddTxnModal customer={customer} initialType={editTxn?.type || modalType} initialTxn={editTxn} onClose={() => { setModalType(null); setEditTxn(null); }} onAdd={txn => { onAddTxn(customer.id, txn); setModalType(null); setEditTxn(null); }} onSave={txn => { onEditTxn(customer.id, txn); setModalType(null); setEditTxn(null); }} />}
    </div>
  );
}
