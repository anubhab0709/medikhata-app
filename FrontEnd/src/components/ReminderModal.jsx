import { useMemo, useState } from 'react';
import Ico from './Ico.jsx';
import { useLang, buildReminderMessage } from '../context/lang.jsx';
import { fmtCur } from '../utils/data.js';

export default function ReminderModal({ customer, onClose, onSent, shopInfo }) {
  const t = useLang();
  const [msgLang, setMsgLang] = useState(() => (
    shopInfo?.defaultTemplateLang === 'en' || shopInfo?.messageLanguage === 'en' ? 'en' : 'bn'
  ));
  const [useCustom, setUseCustom] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const template = useMemo(() => buildReminderMessage({
    lang: msgLang,
    shopInfo,
    t,
    name: customer.name,
    amount: customer.balance,
  }), [msgLang, customer.name, customer.balance, shopInfo, t]);

  const finalMsg = useCustom ? customMsg : template;
  const waPhone = (() => {
    const cc = (shopInfo?.whatsappCountryCode || '91').replace(/\D/g, '') || '91';
    let digits = String(customer.phone || '').replace(/\D/g, '');
    if (!digits) return '';
    // Strip leading 0 (local format) and avoid double country code (e.g. 91 already in number)
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (digits.startsWith(cc)) return digits;
    if (digits.length > 10) return digits;
    return `${cc}${digits}`;
  })();
  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(finalMsg)}`
    : `https://wa.me/?text=${encodeURIComponent(finalMsg)}`;
  const smsLink = `sms:${customer.phone}?body=${encodeURIComponent(finalMsg)}`;
  const lastReminderText = customer.lastReminded
    ? new Date(customer.lastReminded).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : 'Not sent yet';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalMsg);
    } catch {
      // Clipboard may be unavailable in some browsers/contexts.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await onSent(customer.id);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-panel relative bg-white w-full max-w-md sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[92vh] flex flex-col overflow-hidden safe-area-pb" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reminder-modal-title">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="bg-white flex items-center justify-between px-4 sm:px-5 pt-3 sm:pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">{t.reminderTitle}</p>
            <h2 id="reminder-modal-title" className="text-base font-semibold text-slate-900">{customer.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors focus-ring" aria-label="Close"><Ico.X className="w-4 h-4" /></button>
        </div>
        
        <div className="p-5 overflow-y-auto flex-1">
          <div className="sm:grid sm:grid-cols-12 sm:gap-5 sm:items-start">
            <div className="space-y-4 sm:col-span-8">
              <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider mb-0.5">{t.totalDue}</p>
                  <p className="text-2xl font-bold text-red-700 leading-none">{fmtCur(customer.balance)}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-gray-700 justify-end font-medium text-sm">
                    <Ico.Phone className="w-4 h-4" /><span>{customer.phone}</span>
                  </div>
                  {customer.area && <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{customer.area}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setUseCustom(false)} className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-all ${!useCustom ? 'border-primary-200 text-primary-700 bg-primary-50 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t.useTemplate}</button>
                <button onClick={() => { setUseCustom(true); if (!customMsg) setCustomMsg(template); }} className={`flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-all ${useCustom ? 'border-primary-200 text-primary-700 bg-primary-50 shadow-sm' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{t.customMessage}</button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.messageLanguage}</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg">
                  <button onClick={() => setMsgLang('bn')} className={`py-1.5 rounded-md text-[11px] font-medium transition-all ${msgLang === 'bn' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                    {t.bengali}
                  </button>
                  <button onClick={() => setMsgLang('en')} className={`py-1.5 rounded-md text-[11px] font-medium transition-all ${msgLang === 'en' ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800'}`}>
                    {t.english}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.messagePreview}</label>
                {useCustom ? (
                  <textarea
                    value={customMsg}
                    onChange={e => setCustomMsg(e.target.value)}
                    rows={10}
                    className="input !h-auto min-h-[220px] sm:min-h-[260px] resize-y py-3 leading-relaxed bg-primary-50/50 border-primary-200 focus:border-primary-400 text-sm w-full"
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium leading-relaxed whitespace-pre-line text-gray-700 min-h-[220px] sm:min-h-[260px]">{template}</div>
                )}
              </div>
            </div>
            
            <div className="mt-5 space-y-2.5 sm:mt-0 sm:col-span-4 sm:sticky sm:top-5">
                <a href={waLink} target="_blank" rel="noreferrer" onClick={handleSend} className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold py-3 rounded-lg transition-all active:scale-95 text-sm w-full shadow-sm">
                  <Ico.WA className="w-4 h-4" /> {sending ? 'Wait...' : 'Send via WhatsApp'}
              </a>
                <a href={smsLink} onClick={handleSend} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all active:scale-95 text-sm w-full shadow-sm">
                  <Ico.SMS className="w-4 h-4" /> {sending ? 'Wait...' : 'Send SMS'}
              </a>
              <button onClick={handleCopy} className={`flex items-center justify-center gap-2 border py-3 rounded-lg transition-all active:scale-95 text-sm w-full font-medium ${copied ? 'border-primary-200 text-primary-700 bg-primary-50' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {copied ? <><Ico.Check className="w-4 h-4" /> Copied</> : <><Ico.Copy className="w-4 h-4" /> Copy Message</>}
              </button>
              
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mt-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Last Reminder</p>
                <p className="text-xs font-semibold text-gray-900">{lastReminderText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
