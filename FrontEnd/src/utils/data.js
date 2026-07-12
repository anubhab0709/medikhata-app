export const formatDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
};

export const formatTime = iso => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const fmtCur = n => `₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;

export const daysDiff = iso => {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso)) / 86400000);
};

