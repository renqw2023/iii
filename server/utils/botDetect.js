/**
 * Bot detection utility
 * Returns true if the User-Agent matches known search engine / social crawlers.
 */
const BOT_UA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|applebot|semrushbot|ahrefsbot|rogerbot/i;

function isBot(req) {
  return BOT_UA.test(req.headers['user-agent'] || '');
}

module.exports = { isBot };
