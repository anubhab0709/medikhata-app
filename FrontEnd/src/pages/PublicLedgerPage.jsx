import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { fmtCur, formatDate } from '../utils/data.js';
import { downloadCustomerLedgerPdf } from '../utils/billExport.js';
import { publicApi } from '../utils/api.js';

export default function PublicLedgerPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    document.title = 'KhataApp — Customer Ledger';
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const clean = String(token || '').trim();
        if (!clean) {
          if (active) setError('Invalid ledger link');
          return;
        }
        const data = await publicApi.getLedger(clean);
        if (active) setPayload(data);
      } catch (err) {
        if (active) setError(err?.message || 'Unable to open ledger');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  const handleDownload = async () => {
    if (!payload?.customer || downloading) return;
    setDownloading(true);
    try {
      await downloadCustomerLedgerPdf(payload.customer, payload.shop);
    } catch {
      setError('Unable to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading ledger…</p>
      </div>
    );
  }

  if (error || !payload?.customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center gap-3">
        <Logo size={40} />
        <p className="text-base font-semibold text-slate-800">Ledger unavailable</p>
        <p className="text-sm text-slate-500 max-w-sm">{error || 'This link is invalid or no longer active.'}</p>
      </div>
    );
  }

  const { customer, shop } = payload;
  const txns = [...(customer.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Logo size={28} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight">KhataApp</p>
            <p className="text-[11px] text-slate-500 truncate">{shop?.shopName || 'Customer ledger'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="btn btn-sm shrink-0"
        >
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-base font-semibold text-slate-900">{shop?.shopName}</p>
          {shop?.shopAddress && <p className="text-xs text-slate-500 mt-1">{shop.shopAddress}</p>}
          {shop?.shopEmail && <p className="text-xs text-slate-500">{shop.shopEmail}</p>}
          {shop?.shopPhone && <p className="text-xs text-slate-500">Ph: {shop.shopPhone}</p>}
          <p className="text-[11px] font-semibold tracking-wide text-slate-700 mt-2.5">CUSTOMER LEDGER STATEMENT</p>
          <div className="mt-2 border-b border-slate-800" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Customer</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{customer.name}</p>
            <p className="text-xs text-slate-500">{customer.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Balance</p>
            <p className={`text-lg font-bold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {fmtCur(customer.balance)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">Entries</p>
            <p className="text-[11px] text-slate-500">{txns.length} records</p>
          </div>
          {txns.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No transactions yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {txns.map((tx) => (
                <li key={tx.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{tx.note || (tx.type === 'credit' ? 'Credit' : 'Payment')}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${tx.type === 'credit' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {tx.type === 'credit' ? '+' : '−'}{fmtCur(tx.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500">Bal {fmtCur(tx.balance)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-slate-400 pb-8">Powered by KhataApp</p>
      </main>
    </div>
  );
}
