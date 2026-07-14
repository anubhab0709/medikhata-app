import { useState } from 'react';
import Ico from './Ico.jsx';
import { useLang } from '../context/lang.jsx';

export default function EditCustModal({ customer, onClose, onSave }) {
  const t = useLang();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [area, setArea] = useState(customer?.area || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fields = [
    { l: t.fullName, v: name, s: setName, p: t.namePlaceholder, tp: 'text', auto: 'name', mode: 'text' },
    { l: t.phone, v: phone, s: setPhone, p: t.phonePlaceholder, tp: 'tel', auto: 'tel', mode: 'tel' },
    { l: t.area, v: area, s: setArea, p: t.areaPlaceholder, tp: 'text', auto: 'street-address', mode: 'text' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        area: area.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Unable to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-panel relative bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden safe-area-pb"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-cust-title"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 sm:pt-5 pb-3 border-b border-slate-100 bg-white">
          <h2 id="edit-cust-title" className="text-sm font-semibold text-slate-900">Edit Customer</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors focus-ring" aria-label="Close">
            <Ico.X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {fields.map(f => (
            <div key={f.l} className="space-y-1">
              <label className="block text-[11px] font-medium text-gray-600 mb-1">{f.l}</label>
              <input
                type={f.tp}
                value={f.v}
                onChange={e => f.s(e.target.value)}
                placeholder={f.p}
                autoComplete={f.auto}
                inputMode={f.mode}
                className="input"
              />
            </div>
          ))}
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <button type="submit" disabled={!name.trim() || saving} className="btn w-full mt-2">
            <Ico.Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
