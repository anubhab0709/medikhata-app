/** Absolute share URL for a customer's public ledger / PDF page */
export function buildLedgerShareUrl(token) {
  const clean = String(token || '').trim();
  if (!clean) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return origin ? `${origin}/l/${clean}` : `/l/${clean}`;
}

export function appendLedgerLinkToMessage(message, ledgerLink, lang = 'en') {
  const link = String(ledgerLink || '').trim();
  const body = String(message || '').trim();
  if (!link) return body;
  if (body.includes(link)) return body;
  const label = lang === 'bn'
    ? 'আপনার লেজার / PDF দেখুন বা ডাউনলোড করুন:'
    : 'View / download your ledger PDF:';
  return `${body}\n\n${label}\n${link}`;
}
