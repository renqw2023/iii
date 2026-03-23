import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CheckCircle, XCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditsAPI } from '../services/creditsApi';

const statusBadge = (status) => {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
        <CheckCircle size={11} />
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
      <XCircle size={11} />
      Refunded
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    creditsAPI.getOrders()
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gallery-filter-hover-bg,#f1f5f9)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={18} />
        </button>
        <ShoppingBag size={22} style={{ color: 'var(--text-primary)' }} />
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Order History
        </h1>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse"
                 style={{ backgroundColor: 'var(--gallery-filter-hover-bg,#f1f5f9)' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ShoppingBag size={48} style={{ color: 'var(--text-tertiary,#94a3b8)' }} />
          <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>No orders yet</p>
          <Link
            to="/credits"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#1B1B1B' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#363636'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1B1B1B'}
          >
            Add Credits
          </Link>
        </div>
      )}

      {/* Order list */}
      {!loading && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order._id}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{
                border: '1px solid var(--border-color,#e5e7eb)',
                backgroundColor: 'var(--bg-secondary,#fff)',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {order.planName}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    ${Number(order.amountUSD).toFixed(2)} {(order.currency || 'usd').toUpperCase()}
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#6366f1' }}>
                    +{order.credits} Credits
                  </span>
                  <button
                    title="Download Invoice"
                    onClick={() => window.open(
                      `/invoice/${order._id}?` + new URLSearchParams({
                        plan: order.planName,
                        amount: order.amountUSD,
                        credits: order.credits,
                        currency: order.currency || 'usd',
                        date: order.createdAt,
                        orderId: order._id,
                      }),
                      '_blank'
                    )}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: 'var(--text-tertiary,#94a3b8)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary,#94a3b8)'}
                  >
                    <Printer size={14} />
                  </button>
                </div>
                {statusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
