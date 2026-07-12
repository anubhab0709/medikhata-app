/** Simple password strength meter */
export default function PasswordStrength({ password = '' }) {
  const checks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Za-z]/.test(password), label: 'A letter' },
    { ok: /\d/.test(password), label: 'A number' },
  ];
  const score = checks.filter((c) => c.ok).length;
  const tones = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${score >= i ? tones[score] : 'bg-slate-100'}`} />
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        Strength: <span className="font-semibold text-slate-700">{labels[score]}</span>
        {' · '}
        {checks.filter((c) => !c.ok).map((c) => c.label).join(', ') || 'Looks good'}
      </p>
    </div>
  );
}
