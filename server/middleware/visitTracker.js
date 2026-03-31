const VisitLog = require('../models/VisitLog');
const { getGeoLocation } = require('../utils/analyticsUtils');

// Paths/extensions to skip — static assets and internal routes
const SKIP_PREFIXES = ['/output/', '/uploads/', '/Circle/', '/favicon'];
const SKIP_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/i;
const SKIP_EXACT = new Set(['/api/payments/webhook', '/health']);

const buffer = [];
const FLUSH_INTERVAL = 30 * 1000;
const MAX_BUFFER = 500;

async function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.slice(0, MAX_BUFFER);
  try {
    await VisitLog.insertMany(batch, { ordered: false });
    buffer.splice(0, batch.length);  // only remove after successful write
  } catch (err) {
    console.error('[visitTracker] flush failed:', err.message);
    // keep data in buffer; next interval will retry
  }
}

setInterval(flush, FLUSH_INTERVAL);

// Flush remaining buffer before process exits
process.on('SIGTERM', flush);
process.on('SIGINT', flush);

function visitTracker(req, res, next) {
  const path = req.path || req.url || '';

  if (
    SKIP_EXACT.has(path) ||
    SKIP_PREFIXES.some(p => path.startsWith(p)) ||
    SKIP_EXTENSIONS.test(path)
  ) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const ip =
      req.headers['cf-connecting-ip'] ||
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.ip ||
      '';

    const geo = getGeoLocation(ip);
    buffer.push({
      ip,
      path: path.length > 200 ? path.slice(0, 200) : path,
      method: req.method,
      status: res.statusCode,
      userId: req.user?._id || undefined,
      userAgent: (req.headers['user-agent'] || '').slice(0, 200),
      duration: Date.now() - start,
      country: geo.country || '',
      city: geo.city || '',
    });

    if (buffer.length >= MAX_BUFFER) flush();
  });

  next();
}

module.exports = visitTracker;
