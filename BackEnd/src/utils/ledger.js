/** Normalize Mongoose docs / plain objects into ledger-safe plain fields. */
export function toPlainTransaction(tx) {
  const raw = tx?.toObject?.({ flattenMaps: true }) || tx || {};
  return {
    id: String(raw.id ?? ''),
    type: raw.type,
    amount: Number(raw.amount) || 0,
    note: raw.note || '',
    date: raw.date,
    balance: raw.balance,
  };
}

export function recalculateTransactions(inputTransactions = []) {
  const ordered = inputTransactions
    .map(toPlainTransaction)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  return ordered.map((tx) => {
    const amount = Math.round((Number(tx.amount) || 0) * 100) / 100;
    running += tx.type === 'credit' ? amount : -amount;
    return {
      id: String(tx.id),
      type: tx.type,
      amount,
      note: tx.note || '',
      date: new Date(tx.date),
      balance: Math.round(running * 100) / 100,
    };
  });
}
