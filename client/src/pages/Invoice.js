import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Invoice = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const plan      = searchParams.get('plan')     || '—';
  const amount    = searchParams.get('amount')   || '0';
  const credits   = searchParams.get('credits')  || '0';
  const currency  = (searchParams.get('currency') || 'usd').toUpperCase();
  const dateStr   = searchParams.get('date')     || new Date().toISOString();
  const orderId   = searchParams.get('orderId')  || '—';
  const shortId   = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();

  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const invoiceNum = `INV-${shortId}`;

  useEffect(() => {
    document.title = `${invoiceNum} — III.PICS`;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [invoiceNum]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
          #invoice-root { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
        }
        @page { size: A4; margin: 1.2cm; }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ textAlign: 'center', padding: '24px 0 0', background: '#f5f5f5' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 28px', borderRadius: 8, border: '1px solid #d1d5db',
            background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          ↓ Download / Print PDF
        </button>
      </div>

      <div
        id="invoice-root"
        style={{
          maxWidth: 680,
          margin: '24px auto 56px',
          background: '#fff',
          borderRadius: 4,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: '48px 56px',
        }}
      >
        {/* ── Top row: title + logo ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>Invoice</h1>
            <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {[
                  ['Invoice number', invoiceNum],
                  ['Date of issue',  formattedDate],
                  ['Status',         'Paid'],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ color: '#6b7280', paddingRight: 24, paddingBottom: 4, fontWeight: 400 }}>{k}</td>
                    <td style={{ color: k === 'Status' ? '#16a34a' : '#111827', fontWeight: k === 'Invoice number' ? 600 : 400, paddingBottom: 4 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Logo */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px', fontStyle: 'italic', color: '#111827' }}>III</span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.6px', color: '#7c3aed' }}>.PICS</span>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: 28 }} />

        {/* ── From / Bill to ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 36, fontSize: 13 }}>
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#111827', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</p>
            <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#111827' }}>III.PICS</p>
            <p style={{ margin: '0 0 2px', color: '#6b7280' }}>iii.pics</p>
            <p style={{ margin: 0, color: '#6b7280' }}>support@iii.pics</p>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#111827', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bill to</p>
            <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#111827' }}>{user?.username || '—'}</p>
            <p style={{ margin: 0, color: '#6b7280' }}>{user?.email || '—'}</p>
          </div>
        </div>

        {/* ── Amount headline ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, color: '#6b7280' }}>Amount paid</p>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
            ${Number(amount).toFixed(2)} {currency}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
            ✓ Paid · {formattedDate}
          </p>
        </div>

        {/* ── Line items ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111827' }}>
              {['Description', 'Qty', 'Unit price', 'Amount'].map(h => (
                <th key={h} style={{
                  textAlign: h === 'Description' ? 'left' : 'right',
                  padding: '8px 0', fontWeight: 600, color: '#111827', fontSize: 12,
                  paddingRight: h !== 'Amount' ? 16 : 0,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '14px 16px 14px 0', color: '#111827' }}>
                <span style={{ fontWeight: 500 }}>{plan} Credit Pack</span>
                <br />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>
                  {Number(credits).toLocaleString()} permanent credits · Never expire
                </span>
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'right', color: '#374151' }}>1</td>
              <td style={{ padding: '14px 16px', textAlign: 'right', color: '#374151' }}>
                ${Number(amount).toFixed(2)}
              </td>
              <td style={{ padding: '14px 0', textAlign: 'right', color: '#111827', fontWeight: 500 }}>
                ${Number(amount).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Totals ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 220 }}>
            <tbody>
              <tr>
                <td style={{ color: '#6b7280', padding: '4px 24px 4px 0' }}>Subtotal</td>
                <td style={{ textAlign: 'right', color: '#374151', padding: '4px 0' }}>${Number(amount).toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ color: '#6b7280', padding: '4px 24px 4px 0' }}>Tax</td>
                <td style={{ textAlign: 'right', color: '#374151', padding: '4px 0' }}>$0.00</td>
              </tr>
              <tr style={{ borderTop: '2px solid #111827' }}>
                <td style={{ fontWeight: 700, color: '#111827', padding: '10px 24px 4px 0' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: '#111827', fontSize: 16, padding: '10px 0 4px' }}>
                  ${Number(amount).toFixed(2)} {currency}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: '#16a34a', padding: '2px 24px 0 0', fontSize: 12 }}>Amount paid</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a', padding: '2px 0 0', fontSize: 12 }}>
                  ${Number(amount).toFixed(2)} {currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer note ── */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, fontSize: 12, color: '#9ca3af', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 4px' }}>
            This invoice has been paid. No further action required.
          </p>
          <p style={{ margin: 0 }}>
            One-time purchase · Credits never expire · Questions?{' '}
            <a href="mailto:support@iii.pics" style={{ color: '#7c3aed', textDecoration: 'none' }}>support@iii.pics</a>
          </p>
        </div>

        {/* ── Page footer ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 16, borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#d1d5db' }}>
          <span>© 2026 III.PICS</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </>
  );
};

export default Invoice;
