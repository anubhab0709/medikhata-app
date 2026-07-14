import { buildLedgerStatementData } from '../components/LedgerPdfTemplate.jsx';
import { fmtCur } from './data.js';

const formatBillDate = (iso) => new Date(iso).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const sanitizePhone = (value, countryCode = '91') => {
  const cc = String(countryCode || '91').replace(/\D/g, '') || '91';
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (digits.startsWith(cc)) return digits;
  if (digits.length > 10) return digits;
  return `${cc}${digits}`;
};

const buildBillMessage = (customer, shopInfo) => {
  const transactions = Array.isArray(customer?.transactions) ? customer.transactions : [];
  const latest = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const lastDate = latest.at(-1)?.date;
  return [
    `*${shopInfo?.shopName || 'Shop Ledger Bill'}*`,
    shopInfo?.shopAddress || '',
    '',
    `Customer: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Current Balance: ${fmtCur(customer.balance)}`,
    lastDate ? `Updated On: ${formatBillDate(lastDate)}` : '',
    '',
    'Please check your ledger bill. A PDF copy can be downloaded from the app.',
  ].filter(Boolean).join('\n');
};

const ensureInterFont = async () => {
  if (document.querySelector('link[data-ledger-pdf-font="inter"]')) {
    if (document.fonts?.ready) await document.fonts.ready;
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
  link.dataset.ledgerPdfFont = 'inter';
  document.head.appendChild(link);
  if (document.fonts?.ready) await document.fonts.ready;
};

const escapeHtml = (str) => {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const buildPdfMarkup = (customer, shopInfo) => {
  const data = buildLedgerStatementData(customer, shopInfo);
  const rs = data.formatRs;
  const dash = '—';

  return `
    <div id="ledger-pdf-root" style="width:794px;background:#ffffff;padding:36px 40px;font-family:Inter, Arial, Helvetica, sans-serif;color:#111827;box-sizing:border-box;">
      <div style="width:100%;box-sizing:border-box;">
        <div style="text-align:center;padding-bottom:10px;border-bottom:2.5px solid #111827;">
          <div style="font-size:32px;font-weight:800;letter-spacing:-0.01em;line-height:1.15;">${escapeHtml(data.store.name)}</div>
        </div>
        <div style="text-align:center;padding:8px 0 12px;border-bottom:2.5px solid #111827;font-size:12px;color:#4b5563;">
          ${escapeHtml(data.store.address)} • Ph: ${escapeHtml(data.store.phone)}
        </div>

        <div style="margin-top:16px;border:1.5px solid #111827;padding:10px 14px;text-align:center;font-size:13px;font-weight:800;letter-spacing:0.08em;">
          CUSTOMER LEDGER STATEMENT
        </div>

        <div style="margin-top:0;border:1.5px solid #111827;border-top:none;display:flex;">
          <div style="flex:1;padding:16px 18px;border-right:1px solid #d1d5db;">
            <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.08em;">BILLED TO</div>
            <div style="margin-top:8px;font-size:20px;font-weight:800;color:#111827;">${escapeHtml(data.customer.name)}</div>
            <div style="margin-top:8px;font-size:13px;color:#374151;">${escapeHtml(data.customer.phone)}</div>
            <div style="margin-top:6px;font-size:12px;color:#6b7280;">Updated : ${escapeHtml(data.meta.lastUpdated)}</div>
          </div>
          <div style="width:280px;padding:14px 18px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span style="color:#6b7280;">Statement ID</span>
              <span style="font-weight:700;text-align:right;">${escapeHtml(data.meta.invoiceId)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span style="color:#6b7280;">Generated</span>
              <span style="font-weight:600;text-align:right;">${escapeHtml(data.meta.generatedDate)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span style="color:#6b7280;">Total Credit</span>
              <span style="font-weight:700;">${rs(data.summary.totalCredit)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span style="color:#6b7280;">Total Debit</span>
              <span style="font-weight:700;">${rs(data.summary.totalDebit)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;gap:8px;padding-top:6px;border-top:1px solid #e5e7eb;">
              <span style="font-weight:700;">Net Balance</span>
              <span style="font-weight:800;">${rs(data.summary.finalBalance)}</span>
            </div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:18px;font-size:12px;">
          <thead>
            <tr style="background:#111827;color:#ffffff;">
              <th style="padding:10px 8px;text-align:center;font-weight:700;width:48px;">S.NO.</th>
              <th style="padding:10px 8px;text-align:left;font-weight:700;width:100px;">DATE</th>
              <th style="padding:10px 8px;text-align:left;font-weight:700;">PARTICULARS</th>
              <th style="padding:10px 8px;text-align:right;font-weight:700;width:110px;">CREDIT (Rs.)</th>
              <th style="padding:10px 8px;text-align:right;font-weight:700;width:110px;">DEBIT (Rs.)</th>
              <th style="padding:10px 8px;text-align:right;font-weight:700;width:110px;">BALANCE (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${data.sections.length === 0 ? `
              <tr>
                <td colspan="6" style="padding:28px;text-align:center;color:#9ca3af;border:1px solid #e5e7eb;">No transactions</td>
              </tr>
            ` : data.sections.map((section) => `
              <tr>
                <td colspan="6" style="background:#f3f4f6;padding:8px 12px;text-align:center;font-weight:700;color:#374151;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;letter-spacing:0.04em;">${escapeHtml(section.label)}</td>
              </tr>
              ${section.rows.map((row) => `
                <tr>
                  <td style="padding:9px 8px;text-align:center;color:#6b7280;border:1px solid #e5e7eb;">${escapeHtml(row.serial)}</td>
                  <td style="padding:9px 8px;color:#4b5563;border:1px solid #e5e7eb;">${escapeHtml(row.dateLabel)}</td>
                  <td style="padding:9px 8px;color:#111827;border:1px solid #e5e7eb;">${escapeHtml(row.particulars)}</td>
                  <td style="padding:9px 8px;text-align:right;font-weight:600;border:1px solid #e5e7eb;">${row.credit ? rs(row.credit) : dash}</td>
                  <td style="padding:9px 8px;text-align:right;font-weight:600;border:1px solid #e5e7eb;">${row.debit ? rs(row.debit) : dash}</td>
                  <td style="padding:9px 8px;text-align:right;font-weight:700;border:1px solid #e5e7eb;">${rs(row.balance)}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr style="background:#111827;color:#ffffff;">
              <td colspan="3" style="padding:10px 12px;font-weight:800;">TOTALS</td>
              <td style="padding:10px 8px;text-align:right;font-weight:700;">${rs(data.summary.totalCredit)}</td>
              <td style="padding:10px 8px;text-align:right;font-weight:700;">${rs(data.summary.totalDebit)}</td>
              <td style="padding:10px 8px;text-align:right;font-weight:800;">${rs(data.summary.finalBalance)}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:18px;display:flex;gap:0;border:1.5px solid #111827;">
          <div style="flex:1;padding:14px 16px;border-right:1px solid #d1d5db;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;">
              <span style="color:#6b7280;">Total Transactions</span>
              <span style="font-weight:700;">${data.summary.totalTransactions}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;">
              <span style="color:#6b7280;">Total Credit</span>
              <span style="font-weight:700;">${rs(data.summary.totalCredit)}</span>
            </div>
          </div>
          <div style="width:280px;padding:14px 16px;">
            <div style="font-size:10px;color:#9ca3af;font-weight:700;letter-spacing:0.08em;">CLOSING BALANCE</div>
            <div style="margin-top:8px;border-top:1px solid #e5e7eb;padding-top:8px;font-size:28px;font-weight:800;text-align:right;">${rs(data.summary.finalBalance)}</div>
          </div>
        </div>

        <div style="margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px;">
          <div style="font-size:11px;color:#6b7280;font-style:italic;max-width:360px;">
            This is a computer-generated statement and does not require a physical signature.
          </div>
          <div style="width:200px;text-align:center;">
            <div style="border-top:1px solid #111827;padding-top:6px;font-size:12px;color:#374151;">Authorised Signatory</div>
          </div>
        </div>

        <div style="margin-top:28px;padding-top:10px;border-top:1px solid #d1d5db;display:flex;justify-content:space-between;font-size:11px;color:#6b7280;">
          <span>${escapeHtml(data.store.name)} — Customer Ledger</span>
          <span>Page 1 of 1</span>
          <span>System generated document.</span>
        </div>
      </div>
    </div>
  `;
};

const cleanFileName = (value) => String(value || 'customer-ledger')
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'customer-ledger';

export const downloadCustomerLedgerPdf = async (customer, shopInfo) => {
  await ensureInterFont();
  const [{ default: html2canvas }, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;

  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.zIndex = '-1';
  host.innerHTML = buildPdfMarkup(customer, shopInfo);
  document.body.appendChild(host);

  const element = host.firstElementChild;
  const fileName = `${cleanFileName(customer?.name)}-ledger-statement.pdf`;
  const options = {
    margin: 0,
    filename: fileName,
    pagebreak: { mode: ['css', 'legacy'] },
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };
  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

  try {
    if (!element) {
      throw new Error('Ledger PDF content could not be created');
    }

    await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f8fafc',
      windowWidth: 794,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({
      orientation: options.jsPDF.orientation,
      unit: options.jsPDF.unit,
      format: options.jsPDF.format,
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const pageHeightPx = Math.floor((canvasWidth * pageHeight) / pageWidth);
    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeight;

      const pageContext = pageCanvas.getContext('2d');
      if (!pageContext) {
        throw new Error('Canvas context could not be created');
      }

      pageContext.fillStyle = '#f8fafc';
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(
        canvas,
        0,
        renderedHeight,
        canvasWidth,
        sliceHeight,
        0,
        0,
        canvasWidth,
        sliceHeight
      );

      const imageData = pageCanvas.toDataURL('image/jpeg', 0.98);
      const imageHeight = (sliceHeight * pageWidth) / canvasWidth;

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imageData, 'JPEG', 0, 0, pageWidth, imageHeight, undefined, 'FAST');

      renderedHeight += sliceHeight;
      pageIndex += 1;
    }

    const blob = pdf.output('blob');

    if (!(blob instanceof Blob)) {
      throw new Error('PDF file could not be generated');
    }

    if (isMobileDevice && typeof File !== 'undefined' && navigator.share) {
      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `${customer?.name || 'Customer'} Ledger Statement`,
          text: 'Ledger statement PDF',
        });
        return { method: 'share' };
      }
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (!isMobileDevice) {
      return { method: 'download' };
    }

    window.setTimeout(() => {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }, 120);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return { method: 'open' };
  } catch (error) {
    console.error('Ledger PDF export failed', error);
    throw error;
  } finally {
    host.remove();
  }
};

export const openBillOnWhatsApp = (customer, shopInfo) => {
  const phone = sanitizePhone(customer.phone, shopInfo?.whatsappCountryCode);
  const message = encodeURIComponent(buildBillMessage(customer, shopInfo));
  const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
