/** Keep last 10 digits for Indian mobile numbers (+91 / leading 0 stripped). */
export function normalizePhoneDigits(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(-10);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

/** Letters (any language), spaces, and common name punctuation. Max 25. */
export function validateCustomerName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Customer name is required';
  if (trimmed.length > 25) return 'Name must be under 25 characters';
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(trimmed)) {
    return 'Name can only contain letters (no numbers or symbols)';
  }
  return '';
}

/** Phone must be exactly 10 digits after normalization. */
export function validateCustomerPhone(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return 'Phone number is required';
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!/^\d{10}$/.test(digits)) return 'Phone number must be exactly 10 digits';
  return '';
}

export function validateCustomerForm({ name, phone }) {
  return validateCustomerName(name) || validateCustomerPhone(phone) || '';
}

/** Returns existing customer if this 10-digit phone is already used. */
export function findDuplicateCustomerByPhone(customers, phone, excludeId = null) {
  const target = normalizePhoneDigits(phone);
  if (!target || target.length !== 10) return null;
  const list = Array.isArray(customers) ? customers : [];
  return list.find((c) => {
    if (!c) return false;
    if (excludeId != null && String(c.id) === String(excludeId)) return false;
    return normalizePhoneDigits(c.phone) === target;
  }) || null;
}
