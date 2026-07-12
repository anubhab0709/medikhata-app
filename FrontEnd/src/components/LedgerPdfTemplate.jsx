const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatDateTime = (value) => {
  const d = new Date(value);
  const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${date}, ${time}`;
};

const formatMonth = (value) => new Date(value).toLocaleDateString('en-IN', {
  month: 'long',
  year: 'numeric',
}).toUpperCase();

const formatRs = (value) => {
  const n = Math.round(Math.abs(Number(value) || 0));
  return `Rs. ${n.toLocaleString('en-IN')}`;
};

const buildInvoiceId = (customer, shopInfo) => {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const prefix = String(shopInfo?.shopName || 'MK')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'MK';
  const idPart = String(customer?.id || '001').replace(/\D/g, '').slice(-3).padStart(3, '0');
  return `${prefix}-${stamp}-${idPart}`;
};

export const buildLedgerStatementData = (customer, shopInfo) => {
  const sortedTransactions = [...(customer?.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sections = [];
  let currentSection = null;
  let serial = 1;

  sortedTransactions.forEach((tx) => {
    const monthLabel = formatMonth(tx.date);
    if (!currentSection || currentSection.label !== monthLabel) {
      currentSection = { label: monthLabel, rows: [] };
      sections.push(currentSection);
    }

    currentSection.rows.push({
      id: tx.id || `${monthLabel}-${serial}`,
      serial: String(serial).padStart(2, '0'),
      dateLabel: formatDate(tx.date),
      particulars: tx.note || (tx.type === 'credit' ? 'Credit Entry' : 'Debit Entry'),
      credit: tx.type === 'credit' ? tx.amount : 0,
      debit: tx.type === 'debit' ? tx.amount : 0,
      balance: tx.balance,
    });
    serial += 1;
  });

  const totalCredit = sortedTransactions.reduce((sum, tx) => sum + (tx.type === 'credit' ? tx.amount : 0), 0);
  const totalDebit = sortedTransactions.reduce((sum, tx) => sum + (tx.type === 'debit' ? tx.amount : 0), 0);
  const currentBalance = customer?.balance || 0;

  return {
    store: {
      name: shopInfo?.shopName || 'Your Shop Name',
      address: shopInfo?.shopAddress || 'Address not provided',
      phone: shopInfo?.shopPhone || 'Not available',
    },
    customer: {
      name: customer?.name || 'Walk-in Customer',
      phone: customer?.phone || 'Not available',
      area: customer?.area || 'Not provided',
    },
    meta: {
      invoiceId: buildInvoiceId(customer, shopInfo),
      generatedDate: formatDateTime(new Date().toISOString()),
      lastUpdated: sortedTransactions.length > 0
        ? formatDate(sortedTransactions[sortedTransactions.length - 1].date)
        : formatDate(new Date().toISOString()),
    },
    sections,
    summary: {
      totalCredit,
      totalDebit,
      finalBalance: currentBalance,
      currentBalance,
      totalTransactions: sortedTransactions.length,
    },
    formatRs,
  };
};
