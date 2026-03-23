/**
 * pdfService.js — Server-side invoice PDF generation using PDFKit
 * Returns a Buffer containing the PDF, suitable for email attachment.
 */
const PDFDocument = require('pdfkit');

/**
 * generateInvoicePDF(opts) → Promise<Buffer>
 *
 * opts: {
 *   invoiceNum   String   e.g. "INV-ABC12345"
 *   planName     String   e.g. "Pro"
 *   amountUSD    Number   e.g. 19.99
 *   currency     String   e.g. "usd"
 *   credits      Number   e.g. 2200
 *   purchasedAt  Date
 *   username     String
 *   email        String
 * }
 */
function generateInvoicePDF(opts = {}) {
  return new Promise((resolve, reject) => {
    const {
      invoiceNum   = 'INV-XXXXXXXX',
      planName     = 'Credits Pack',
      amountUSD    = 0,
      currency     = 'usd',
      credits      = 0,
      purchasedAt  = new Date(),
      username     = '',
      email        = '',
    } = opts;

    const dateStr = new Date(purchasedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const amt    = `$${Number(amountUSD).toFixed(2)} ${currency.toUpperCase()}`;
    const chunks = [];

    const doc = new PDFDocument({ size: 'A4', margin: 56, info: {
      Title: invoiceNum,
      Author: 'III.PICS',
      Subject: 'Purchase Invoice',
    }});

    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Palette ─────────────────────────────────────────────────
    const BLACK    = '#111827';
    const MUTED    = '#6b7280';
    const LIGHT    = '#e5e7eb';
    const ACCENT   = '#7c3aed';
    const GREEN    = '#16a34a';
    const W        = doc.page.width - 112; // usable width

    // ── Helper: horizontal rule ──────────────────────────────────
    const rule = (y, color = LIGHT) => {
      doc.moveTo(56, y).lineTo(56 + W, y).strokeColor(color).lineWidth(0.5).stroke();
    };

    // ── Header row ──────────────────────────────────────────────
    // Logo left
    doc.fontSize(22).font('Helvetica-Bold').fillColor(BLACK).text('III', 56, 52, { continued: true })
       .fillColor(ACCENT).text('.PICS');

    // "Invoice" label right-aligned
    doc.fontSize(26).font('Helvetica-Bold').fillColor(BLACK)
       .text('Invoice', 56, 44, { align: 'right', width: W });

    doc.moveDown(0.4);
    rule(doc.y);

    // ── Invoice meta ─────────────────────────────────────────────
    const metaY = doc.y + 16;
    const col2  = 56 + W / 2 + 20;

    // Left column: invoice fields
    const rows = [
      ['Invoice number', invoiceNum],
      ['Date of issue',  dateStr],
      ['Status',         'Paid'],
    ];
    let curY = metaY;
    rows.forEach(([k, v]) => {
      doc.fontSize(9).font('Helvetica').fillColor(MUTED).text(k, 56, curY);
      const vColor = k === 'Status' ? GREEN : BLACK;
      const vFont  = k === 'Invoice number' ? 'Helvetica-Bold' : 'Helvetica';
      doc.fontSize(9).font(vFont).fillColor(vColor).text(v, 200, curY);
      curY += 16;
    });

    // ── From / Bill to ──────────────────────────────────────────
    const addrY = metaY + rows.length * 16 + 24;

    doc.fontSize(8).font('Helvetica-Bold').fillColor(MUTED)
       .text('FROM', 56, addrY, { characterSpacing: 0.8 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(BLACK)
       .text('III.PICS', 56, addrY + 12);
    doc.fontSize(9).font('Helvetica').fillColor(MUTED)
       .text('iii.pics', 56, addrY + 25)
       .text('support@iii.pics', 56, addrY + 38);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(MUTED)
       .text('BILL TO', col2, addrY, { characterSpacing: 0.8 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor(BLACK)
       .text(username || '—', col2, addrY + 12);
    doc.fontSize(9).font('Helvetica').fillColor(MUTED)
       .text(email || '—', col2, addrY + 25);

    // ── Amount headline ─────────────────────────────────────────
    const amtY = addrY + 68;
    rule(amtY);

    doc.fontSize(9).font('Helvetica').fillColor(MUTED)
       .text('Amount paid', 56, amtY + 14);
    doc.fontSize(28).font('Helvetica-Bold').fillColor(BLACK)
       .text(amt, 56, amtY + 26);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GREEN)
       .text(`✓ Paid  ·  ${dateStr}`, 56, amtY + 60);

    // ── Line items table ─────────────────────────────────────────
    const tableY = amtY + 82;
    rule(tableY);

    // Table header
    doc.fontSize(8).font('Helvetica-Bold').fillColor(MUTED)
       .text('DESCRIPTION',  56,       tableY + 10)
       .text('QTY',          W - 100,  tableY + 10, { width: 40, align: 'right' })
       .text('UNIT PRICE',   W - 56,   tableY + 10, { width: 60, align: 'right' })
       .text('AMOUNT',       W + 8,    tableY + 10, { width: 48, align: 'right' });

    rule(tableY + 22, BLACK);

    // Row
    const rowY = tableY + 30;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(BLACK)
       .text(`${planName} Credit Pack`, 56, rowY);
    doc.fontSize(9).font('Helvetica').fillColor(MUTED)
       .text(`${Number(credits).toLocaleString()} permanent credits · Never expire`, 56, rowY + 14);

    doc.fontSize(10).font('Helvetica').fillColor(BLACK)
       .text('1',         W - 100, rowY, { width: 40,  align: 'right' })
       .text(`$${Number(amountUSD).toFixed(2)}`, W - 56, rowY, { width: 60,  align: 'right' })
       .text(`$${Number(amountUSD).toFixed(2)}`, W + 8,  rowY, { width: 48,  align: 'right' });

    rule(rowY + 34);

    // Totals
    const totY = rowY + 44;
    [
      ['Subtotal', `$${Number(amountUSD).toFixed(2)}`, false, MUTED],
      ['Tax',      '$0.00',                            false, MUTED],
      ['Total',    amt,                                true,  BLACK],
    ].forEach(([label, value, bold, color], i) => {
      const y = totY + i * 18;
      const f = bold ? 'Helvetica-Bold' : 'Helvetica';
      doc.fontSize(bold ? 11 : 9).font(f).fillColor(color)
         .text(label, 56, y, { width: W - 60, align: 'right' })
         .text(value, 56, y, { width: W + 48, align: 'right' });
    });

    // Amount paid (green)
    const paidY = totY + 3 * 18 + 4;
    doc.fontSize(9).font('Helvetica-Bold').fillColor(GREEN)
       .text('Amount paid', 56, paidY, { width: W - 60, align: 'right' })
       .text(amt,           56, paidY, { width: W + 48, align: 'right' });

    // ── Footer note ─────────────────────────────────────────────
    const noteY = paidY + 32;
    rule(noteY);

    doc.fontSize(9).font('Helvetica').fillColor(MUTED)
       .text('This invoice has been paid. No further action required.', 56, noteY + 12)
       .text('One-time purchase · Credits never expire · Questions? support@iii.pics', 56, noteY + 26);

    // Page footer
    const footY = doc.page.height - 48;
    rule(footY, LIGHT);
    doc.fontSize(9).font('Helvetica').fillColor(LIGHT)
       .text('© 2026 III.PICS', 56, footY + 10)
       .text('Page 1 of 1', 56, footY + 10, { align: 'right', width: W });

    doc.end();
  });
}

module.exports = { generateInvoicePDF };
