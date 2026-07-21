import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { authApi, clearAuthToken, supportApi } from '../utils/api.js';
import { REMINDER_AUTOMATION_ENABLED } from '../config/features.js';
import { useLang, DEFAULT_MESSAGE_EN, DEFAULT_MESSAGE_BN } from '../context/lang.jsx';

export default function SettingsPage({ shopInfo, setShopInfo }) {
  const t = useLang();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(shopInfo || {});
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [msgTab, setMsgTab] = useState('en');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop→state mirror for editable form
    setFormData(shopInfo || {});
  }, [shopInfo]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applySavedSettings = (result, fallback) => {
    const nextSettings = result?.settings || fallback;
    setShopInfo?.(prev => ({ ...(prev || {}), ...nextSettings }));
    setFormData(prev => ({ ...prev, ...nextSettings }));
  };

  const handleSave = async () => {
    setSaving(true);
    setPageError('');
    try {
      const result = await authApi.updateSettings(formData);
      applySavedSettings(result, formData);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setPageError(error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPageError('');
    const payload = {
      appLanguage: formData.appLanguage === 'bn' ? 'bn' : 'en',
      defaultTemplateLang: formData.defaultTemplateLang === 'bn' ? 'bn' : 'en',
      messageLanguage: formData.defaultTemplateLang === 'bn' ? 'bn' : 'en',
      messageEn: (formData.messageEn || '').trim() || DEFAULT_MESSAGE_EN,
      messageBn: (formData.messageBn || '').trim() || DEFAULT_MESSAGE_BN,
    };
    try {
      const result = await authApi.updateSettings(payload);
      applySavedSettings(result, payload);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch (error) {
      setPageError(error?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = () => {
    authApi.logout().catch(() => {}).finally(() => {
      clearAuthToken();
      navigate('/login', { replace: true });
    });
  };

  const shopName = formData.shopName || 'Your Shop';
  const initials = shopName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'MK';
  const year = new Date().getFullYear();
  const appLang = formData.appLanguage === 'bn' ? 'bn' : 'en';
  const defaultMsgLang = formData.defaultTemplateLang === 'bn' ? 'bn' : 'en';

  return (
    <div className="flex-1 overflow-y-auto pb-28 sm:pb-10 bg-slate-50">
      <div className="page-shell py-3 sm:py-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-3">
          <div>
            <p className="page-eyebrow">{t.settingsTitle}</p>
            <h1 className="page-title mt-0.5">{t.shopProfile}</h1>
            <p className="page-subtitle hidden sm:block">{t.shopProfileSub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <button type="button" onClick={() => setEditing(true)} className="btn btn-sm min-h-10 h-10">
                {t.editProfile}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => { setEditing(false); setFormData(shopInfo || {}); }} className="btn-secondary btn-sm min-h-10 h-10">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving} className="btn btn-sm min-h-10 h-10">{saving ? 'Saving...' : t.saveSettings}</button>
              </>
            )}
          </div>
        </div>

        {(saved || prefsSaved) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-xs font-medium text-emerald-700">
            {prefsSaved ? t.preferencesSaved : t.saved}
          </div>
        )}
        {pageError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs font-medium text-red-700">{pageError}</div>
        )}

        <div className="card !rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-primary-50 via-white to-white border-primary-100">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary-600 text-white flex items-center justify-center text-base sm:text-xl font-bold shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{shopName}</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{formData.ownerName || 'Owner'}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
                {formData.shopPhone && <span>{formData.shopPhone}</span>}
                {formData.shopEmail && <span className="break-all">{formData.shopEmail}</span>}
                {formData.shopAddress && <span className="line-clamp-1">{formData.shopAddress}</span>}
              </div>
            </div>
            <p className="text-xs sm:text-sm font-bold text-primary-600 text-right shrink-0">Since {year}</p>
          </div>
        </div>

        {/* Shop details + Owner side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="card p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Shop details
            </h3>
            {[
              ['shopName', 'Shop name', 'text'],
              ['brandName', 'Brand name', 'text'],
              ['shopPhone', 'Phone', 'tel'],
              ['shopEmail', 'Email', 'email'],
            ].map(([field, label, type]) => (
              <div key={field}>
                <label className="label">{label}</label>
                {editing ? (
                  <input
                    type={type}
                    value={formData[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="input"
                    autoComplete={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'organization'}
                    inputMode={type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'text'}
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 min-h-[2.75rem] flex items-center">{formData[field] || '—'}</p>
                )}
              </div>
            ))}
          </section>

          <section className="card p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Owner details
            </h3>
            <div>
              <label className="label">Owner name</label>
              {editing ? (
                <input type="text" value={formData.ownerName || ''} onChange={(e) => handleChange('ownerName', e.target.value)} className="input" />
              ) : (
                <p className="text-sm font-semibold text-slate-900 min-h-[2.75rem] flex items-center">{formData.ownerName || '—'}</p>
              )}
            </div>
            <div>
              <label className="label">Address</label>
              {editing ? (
                <textarea value={formData.shopAddress || ''} onChange={(e) => handleChange('shopAddress', e.target.value)} className="input resize-none !h-auto py-2.5" rows={3} />
              ) : (
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">{formData.shopAddress || '—'}</p>
              )}
            </div>
          </section>
        </div>

        {/* Languages stacked left + reminder template right */}
        <section className="card p-4 sm:p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> {t.preferences}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-2xl">{t.reminderMessagesHint}</p>
            </div>
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              className="btn btn-sm min-h-10 h-10 shrink-0"
            >
              {savingPrefs ? 'Saving...' : t.savePreferences}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="label">{t.appLanguage}</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl" role="group" aria-label={t.appLanguage}>
                  <button
                    type="button"
                    aria-pressed={appLang === 'en'}
                    onClick={() => handleChange('appLanguage', 'en')}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all focus-ring ${appLang === 'en' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.english}
                  </button>
                  <button
                    type="button"
                    aria-pressed={appLang === 'bn'}
                    onClick={() => handleChange('appLanguage', 'bn')}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all focus-ring ${appLang === 'bn' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.bengali}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">{t.defaultMsgLang}</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl" role="group" aria-label={t.defaultMsgLang}>
                  <button
                    type="button"
                    aria-pressed={defaultMsgLang === 'en'}
                    onClick={() => handleChange('defaultTemplateLang', 'en')}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all focus-ring ${defaultMsgLang === 'en' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.english}
                  </button>
                  <button
                    type="button"
                    aria-pressed={defaultMsgLang === 'bn'}
                    onClick={() => handleChange('defaultTemplateLang', 'bn')}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-all focus-ring ${defaultMsgLang === 'bn' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {t.bengali}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="label !mb-0">{t.reminderMessages}</label>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMsgTab('en')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${msgTab === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgTab('bn')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${msgTab === 'bn' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                  >
                    বাং
                  </button>
                </div>
              </div>
              {msgTab === 'en' ? (
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">{t.englishTemplate}</p>
                  <textarea
                    value={formData.messageEn || DEFAULT_MESSAGE_EN}
                    onChange={(e) => handleChange('messageEn', e.target.value)}
                    rows={10}
                    className="input resize-none !h-auto min-h-[220px] py-3 text-xs leading-relaxed"
                    placeholder={DEFAULT_MESSAGE_EN}
                  />
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">{t.bengaliTemplate}</p>
                  <textarea
                    value={formData.messageBn || DEFAULT_MESSAGE_BN}
                    onChange={(e) => handleChange('messageBn', e.target.value)}
                    rows={10}
                    className="input resize-none !h-auto min-h-[220px] py-3 text-xs leading-relaxed"
                    placeholder={DEFAULT_MESSAGE_BN}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="card p-4 sm:p-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> Support
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setShowContact(true); setContactSent(false); setContactForm({ name: '', email: '', message: '' }); }}
                className="btn-secondary w-full text-xs"
              >
                Send us a message
              </button>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Phone</p>
                  <a href="tel:+918617569139" className="font-semibold text-slate-800 hover:text-primary-600">+91 86175 69139</a>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Email</p>
                  <a href="mailto:khata.app2026@gmail.com" className="font-semibold text-slate-800 break-all hover:text-primary-600">khata.app2026@gmail.com</a>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:items-end sm:justify-between sm:h-full">
              <button type="button" onClick={handleLogout} className="btn-danger w-full sm:w-auto text-xs px-6">
                Log out
              </button>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center sm:text-right">App version 1.0.0</p>
            </div>
          </div>
        </section>

        {REMINDER_AUTOMATION_ENABLED && (
          <section className="card p-5">
            <p className="text-xs text-slate-500">Reminder automation controls</p>
          </section>
        )}
      </div>

      {showContact && createPortal(
        <div className="modal-backdrop fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowContact(false)} aria-hidden="true" />
          <div
            className="modal-panel relative bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[min(92dvh,92vh)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden shrink-0" aria-hidden="true" />
            <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Contact us</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">We&apos;d love to hear from you</p>
              </div>
              <button type="button" onClick={() => setShowContact(false)} className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">&times;</button>
            </div>
            {contactSent ? (
              <div className="p-6 text-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                <p className="text-base font-semibold text-slate-900 mb-1">Message sent</p>
                <p className="text-xs text-slate-500 mb-5">We&apos;ll get back to you soon.</p>
                <button type="button" onClick={() => setShowContact(false)} className="btn w-full">Done</button>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                  <div>
                    <label className="label">Your name</label>
                    <input type="text" value={contactForm.name} onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))} className="input" placeholder="Enter your name" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={contactForm.email} onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))} className="input" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea value={contactForm.message} onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))} className="input resize-none !h-auto py-2.5" rows={3} placeholder="How can we help?" />
                  </div>
                </div>
                <div className="shrink-0 px-5 pt-3 border-t border-slate-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    disabled={!contactForm.name.trim() || !contactForm.message.trim() || contactSubmitting}
                    className="btn w-full"
                    onClick={async () => {
                      setContactSubmitting(true);
                      setPageError('');
                      try {
                        await supportApi.sendMessage(contactForm);
                        setContactSent(true);
                      } catch (error) {
                        setPageError(error?.message || 'Failed to send message');
                      } finally {
                        setContactSubmitting(false);
                      }
                    }}
                  >
                    {contactSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
