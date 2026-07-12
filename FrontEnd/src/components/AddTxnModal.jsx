import { useState, useEffect, useRef } from 'react';
import Ico from '../utils/icons.jsx';
import { fmtCur } from '../utils/data.js';
import { useLang } from '../context/lang.jsx';

export default function AddTxnModal({ customer, initialType = 'credit', initialTxn = null, onClose, onAdd, onSave }) {
  const t = useLang();
  const [amount, setAmount] = useState(() => initialTxn ? String(initialTxn.amount) : '');
  const [type, setType] = useState(() => initialTxn?.type || initialType);
  const [txnDate, setTxnDate] = useState(() => initialTxn?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(() => initialTxn?.note || '');
  const [err, setErr] = useState('');
  const ref = useRef(null);
  const isEditMode = Boolean(initialTxn);

  useEffect(() => { setTimeout(() => ref.current?.focus(), 80); }, []);

  const submit = (e) => {
    e?.preventDefault();
    const finalType = type;
    const n = Number(amount);
    if (!amount || isNaN(n) || n <= 0) { setErr(t.validAmount); return; }
    const now = new Date();
    const chosenDate = txnDate || new Date().toISOString().slice(0, 10);
    const localDateTime = new Date(`${chosenDate}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
    if (isEditMode && onSave) {
      onSave({ ...initialTxn, amount: n, type: finalType, note, date: localDateTime.toISOString() });
    } else {
      const prevBal = customer.transactions.at(-1)?.balance ?? 0;
      onAdd({ id: `${customer.id}-${Date.now()}`, amount: n, type: finalType, note, date: localDateTime.toISOString(), balance: Math.round(prevBal + (finalType === 'credit' ? n : -n)) });
    }
    onClose();
  };

  const isCredit = type === 'credit';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white w-full max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative flex items-center justify-center px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">{t.newEntryFor}</p>
            <h2 className="text-base font-semibold text-slate-900 leading-tight">{customer.name}</h2>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center justify-center gap-1">
              <Ico.Phone className="w-3 h-3" />{customer.phone}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Close"
          >
            <Ico.X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              {['credit', 'debit'].map(tp => (
                <button
                  type="button"
                  key={tp}
                  onClick={() => setType(tp)}
                  className={`py-2.5 rounded-lg font-semibold text-xs transition-all ${
                    type === tp
                      ? (tp === 'credit' ? 'bg-red-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {tp === 'credit' ? <Ico.Credit className="w-4 h-4" /> : <Ico.Debit className="w-4 h-4" />}
                    {tp === 'credit' ? 'Credit (Due)' : 'Debit (Paid)'}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">{t.amount}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-semibold">₹</span>
                <input
                  ref={ref}
                  type="number"
                  inputMode="numeric"
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErr(''); }}
                  placeholder="0"
                  className="w-full h-14 pl-9 pr-4 text-2xl font-bold border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors text-slate-900"
                />
              </div>
              {err && <p className="mt-1.5 text-red-500 text-[10px] font-medium bg-red-50 px-2 py-1.5 rounded-md">{err}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">Date</label>
              <input
                type="date"
                value={txnDate}
                onChange={e => setTxnDate(e.target.value)}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1.5">{t.note}</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
                className="input text-sm"
              />
            </div>

            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${isCredit ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                {fmtCur(Number(amount))} {isCredit ? t.addedAsDue : t.recordedAsPayment}
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white">
            <button
              type="submit"
              className={`w-full h-12 rounded-xl font-semibold text-white text-sm transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5 shadow-sm ${
                isCredit ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isCredit ? <Ico.Credit className="w-4 h-4" /> : <Ico.Debit className="w-4 h-4" />}
              {isEditMode ? 'Save Changes' : (isCredit ? 'Add Credit' : 'Add Debit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
