import { useState } from 'react';
import Ico from './Ico.jsx';
import { useLang } from '../context/lang.jsx';
import {
  normalizePhoneDigits,
  validateCustomerForm,
  findDuplicateCustomerByPhone,
} from '../utils/customerValidation.js';

export default function AddCustModal({ onClose, onAdd, customers = [] }) {
  const t = useLang();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [loadingContact, setLoadingContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setNameSafe = (value) => {
    setName(String(value || '').slice(0, 25));
    setError('');
  };

  const setPhoneSafe = (value) => {
    // Keep only digits in the field, max 10 (after stripping country junk on paste)
    const digits = normalizePhoneDigits(value).slice(0, 10);
    // If user is typing mid-entry (not yet 10), allow raw digit typing up to 10
    const raw = String(value || '').replace(/\D/g, '');
    if (raw.length <= 10) setPhone(raw.slice(0, 10));
    else setPhone(digits);
    setError('');
  };

  const pickFromContacts = async () => {
    if (!navigator?.contacts?.select) {
      alert('Contact picker is not supported on this device/browser.');
      return;
    }

    try {
      setLoadingContact(true);
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      const selected = contacts?.[0];
      if (!selected) return;

      if (selected.name?.length) setNameSafe(selected.name[0] || '');
      if (selected.tel?.length) setPhoneSafe(selected.tel[0] || '');
    } finally {
      setLoadingContact(false);
    }
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
    const duplicate = findDuplicateCustomerByPhone(customers, phoneDigits);
    if (duplicate) {
      setError(`A customer with this number already exists (${duplicate.name})`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onAdd({
        name: name.trim(),
        phone: phoneDigits,
        area: area.trim(),
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Unable to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="modal-panel relative bg-white w-full max-w-md sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden safe-area-pb" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-cust-title">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 sm:px-5 pt-3 sm:pt-5 pb-3 border-b border-slate-100 bg-white">
          <h2 id="add-cust-title" className="text-sm font-semibold text-slate-900">{t.addCustomer}</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors focus-ring" aria-label="Close"><Ico.X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 sm:p-0 sm:grid sm:grid-cols-[1.2fr_0.8fr] sm:min-h-[300px] bg-white">
          <div className="space-y-4 sm:p-5 sm:border-r sm:border-gray-100">
            <div className="sm:hidden rounded-xl border border-gray-100 bg-gray-50 p-4 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">From Contacts</p>
              <p className="text-xs font-medium text-gray-600 leading-relaxed mb-3">Use your phone contacts to quickly fill the customer name and phone number.</p>
              <button
                type="button"
                onClick={pickFromContacts}
                disabled={loadingContact || saving}
                className="btn-secondary w-full text-xs py-1.5"
              >
                <Ico.Users className="w-4 h-4" /> {loadingContact ? 'Opening...' : 'From Contacts'}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
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
              </div>
              {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
              <button type="submit" disabled={!name.trim() || saving} className="btn w-full mt-5">
                <Ico.Check className="w-4 h-4" /> {saving ? 'Saving...' : t.saveCustomer}
              </button>
            </form>
          </div>

          <div className="hidden sm:flex flex-col justify-between p-5 bg-gray-50">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">From Contacts</p>
              <p className="text-xs font-medium text-gray-600 leading-relaxed mb-4">
                On mobile, you can import a customer directly from your device contacts. This keeps entry fast and reduces typing.
              </p>
              <button
                type="button"
                onClick={pickFromContacts}
                disabled={loadingContact || saving}
                className="btn-secondary w-full text-xs py-1.5"
              >
                <Ico.Users className="w-4 h-4" /> {loadingContact ? 'Opening...' : 'From Contacts'}
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Preview</p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900 text-sm">{name || 'Customer Name'}</p>
                <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5"><Ico.Phone className="w-3 h-3" /> {phone || 'Phone number'}</p>
                <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5"><span>📍</span> {area || 'Area / Address'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
