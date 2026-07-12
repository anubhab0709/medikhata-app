import { useEffect, useRef } from 'react';

/** 6-digit OTP input with auto-advance and paste support */
export default function OtpInput({ value = '', onChange, disabled, length = 6, autoFocus = true }) {
  const digits = Array.from({ length }, (_, i) => value[i] || '');
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const setDigit = (index, char) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    if (raw.length > 1) {
      // Paste into this box
      const chars = raw.slice(0, length - index).split('');
      const next = digits.slice();
      chars.forEach((c, i) => { next[index + i] = c; });
      onChange(next.join('').slice(0, length));
      const focusAt = Math.min(index + chars.length, length - 1);
      refs.current[focusAt]?.focus();
      return;
    }
    setDigit(index, raw);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, '').slice(0, length).replace(/ /g, '') || pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-slate-200 bg-white text-center text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400 disabled:opacity-50"
        />
      ))}
    </div>
  );
}
