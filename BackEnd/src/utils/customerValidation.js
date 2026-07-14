import mongoose from 'mongoose';

/** Shared customer field rules (create / update). */

export function normalizePhoneDigits(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  // +91XXXXXXXXXX / 91XXXXXXXXXX
  if (digits.startsWith('91') && digits.length >= 12) {
    digits = digits.slice(-10);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
}

export function validateCustomerName(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'Customer name is required';
  if (trimmed.length > 25) return 'Name must be under 25 characters';
  if (!/^[\p{L}\p{M}\s'.-]+$/u.test(trimmed)) {
    return 'Name can only contain letters (no numbers or symbols)';
  }
  return '';
}

export function validateCustomerPhone(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return 'Phone number is required';
  if (digits.length !== 10 || !/^\d{10}$/.test(digits)) {
    return 'Phone number must be exactly 10 digits';
  }
  return '';
}

/**
 * Find another customer owned by this user with the same 10-digit mobile.
 * Compares normalized digits so +91 / spaces / leading 0 still match.
 */
export async function findCustomerByPhone(Customer, ownerId, phoneDigits, excludeId = null) {
  const target = normalizePhoneDigits(phoneDigits);
  if (!target || target.length !== 10) return null;

  const oid = mongoose.Types.ObjectId.isValid(String(ownerId))
    ? new mongoose.Types.ObjectId(String(ownerId))
    : ownerId;

  const query = {
    ownerId: oid,
    phone: { $exists: true, $nin: [null, ''] },
  };
  if (excludeId && mongoose.Types.ObjectId.isValid(String(excludeId))) {
    query._id = { $ne: new mongoose.Types.ObjectId(String(excludeId)) };
  }

  // Scan this owner's customers — phone formats in DB are inconsistent
  const docs = await Customer.find(query).select('_id name phone').lean();
  return docs.find((doc) => normalizePhoneDigits(doc.phone) === target) || null;
}
