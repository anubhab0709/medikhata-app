/**
 * Mobile-first confirm sheet / desktop toast for call & delete actions.
 * Replaces browser confirm() and raw tel: prompts.
 */
export default function ConfirmToast({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isDanger = variant === 'danger';
  const confirmClass = isDanger
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-primary-600 hover:bg-primary-700 text-white';
  const accentClass = isDanger
    ? 'bg-red-50 text-red-600 border-red-100'
    : 'bg-primary-50 text-primary-600 border-primary-100';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Dismiss"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-toast-title"
        aria-describedby="confirm-toast-desc"
        className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200/80 safe-area-pb bulk-toast-enter overflow-hidden"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentClass}`}>
              {isDanger ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4.8c0-.9.7-1.6 1.6-1.6h1.7c.7 0 1.3.5 1.5 1.2l.7 2.7c.2.6 0 1.3-.5 1.7l-1.2 1a14.6 14.6 0 0 0 5.4 5.4l1-1.2c.4-.5 1.1-.7 1.7-.5l2.7.7c.7.2 1.2.8 1.2 1.5v1.7c0 .9-.7 1.6-1.6 1.6h-1.2C10.2 21 3 13.8 3 6v-1.2Z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id="confirm-toast-title" className="text-sm font-semibold text-slate-900">{title}</h3>
              {message && (
                <p id="confirm-toast-desc" className="mt-1 text-xs text-slate-500 leading-relaxed">{message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`min-h-11 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
