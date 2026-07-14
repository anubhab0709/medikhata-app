import { useState } from 'react';
import Ico from './Ico.jsx';
import { useLang } from '../context/lang.jsx';
import {
  normalizePhoneDigits,
  validateCustomerForm,
  findDuplicateCustomerByPhone,
} from '../utils/customerValidation.js';

export default function EditCustModal({ customer, customers = [], onClose, onSave }) {
  const t = useLang();
  const [name, setName] = useState(String(customer?.name || '').slice(0, 25));
  const [phone, setPhone] = useState(normalizePhoneDigits(customer?.phone || '').slice(0, 10));
  const [area, setArea] = useState(customer?.area || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setNameSafe = (value) => {
    setName(String(value || '').slice(0, 25));
    setError('');
  };

  const setPhoneSafe = (value) => {
    const raw = String(value || '').replace(/\D/g, '');
    if (raw.length <= 10) setPhone(raw.slice(0, 10));
    else setPhone(normalizePhoneDigits(value).slice(0, 10));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const validationError = validateCustomerForm({ name, phone });
    if (validationError) {
      setError(validationError);
      return;
    }

    const phoneDigits = normalizePhoneDigits(phone);
    const duplicate = findDuplicateCustomerByPhone(customers, phoneDigits, customer?.id);
    if (duplicate) {
      setError(`A customer with this number already exists (${duplicate.name})`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        name: name.trim(),
        phone: phoneDigits,
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
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">{t.fullName}</label>
            <input
              type="text"
              value={name}
              onChange={e => setNameSafe(e.target.value)}
              placeholder={t.namePlaceholder}
              autoComplete="name"
              maxLength={25}
              className="input"
            />
            <p className="text-[10px] text-slate-400">{name.trim().length}/25 characters · letters only</p>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">{t.phone}</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhoneSafe(e.target.value)}
              placeholder="10 digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={10}
              className="input"
            />
            <p className="text-[10px] text-slate-400">{phone.length}/10 digits</p>
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-600 mb-1">{t.area}</label>
            <input
              type="text"
              value={area}
              onChange={e => setArea(e.target.value)}
              placeholder={t.areaPlaceholder}
              autoComplete="street-address"
              className="input"
            />
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <button type="submit" disabled={!name.trim() || saving} className="btn w-full mt-2">
            <Ico.Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
