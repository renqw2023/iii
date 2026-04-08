/**
 * IndexNow — 主动推送新增/更新 URL 给 Bing（及 Yandex）
 * 文档: https://www.bing.com/indexnow/getstarted
 *
 * 使用方式:
 *   const { notifyIndexNow } = require('./indexNow');
 *   await notifyIndexNow(['https://iii.pics/gallery/abc123', 'https://iii.pics/explore/xyz']);
 */

const https = require('https');

const INDEXNOW_KEY = '43c40c7bd4267ddcbe17f64665fc0d13';
const HOST = 'iii.pics';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

/**
 * 推送一组 URL 给 Bing IndexNow
 * @param {string[]} urls - 完整 URL 数组，最多 10,000 条/次
 * @returns {Promise<{status: number, ok: boolean}>}
 */
async function notifyIndexNow(urls) {
  if (!urls || urls.length === 0) return { ok: false, status: 0 };

  const body = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(0, 10000),
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.indexnow.org',
        path: '/indexnow',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume(); // discard body
        const ok = res.statusCode === 200 || res.statusCode === 202;
        if (ok) {
          console.log(`[IndexNow] Submitted ${urls.length} URL(s) — HTTP ${res.statusCode}`);
        } else {
          console.warn(`[IndexNow] Unexpected status ${res.statusCode} for ${urls.length} URL(s)`);
        }
        resolve({ status: res.statusCode, ok });
      }
    );
    req.on('error', (err) => {
      console.error('[IndexNow] Request failed:', err.message);
      resolve({ status: 0, ok: false });
    });
    req.write(body);
    req.end();
  });
}

/**
 * 推送单条 URL（新建内容后调用）
 * @param {string} url
 */
async function notifyOne(url) {
  return notifyIndexNow([url]);
}

module.exports = { notifyIndexNow, notifyOne, INDEXNOW_KEY };
