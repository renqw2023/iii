const maxmind = require('maxmind');
const path = require('path');
const UAParser = require('ua-parser-js');

// maxmind reader — 启动时异步加载一次，查询时同步（按需读取，不全量载入内存）
let cityReader = null;
maxmind.open(path.join(__dirname, '../data/GeoLite2-City.mmdb'))
  .then(reader => {
    cityReader = reader;
    console.log('[maxmind] GeoLite2-City.mmdb loaded');
  })
  .catch(err => {
    console.error('[maxmind] Failed to load GeoLite2-City.mmdb:', err.message);
  });

/**
 * 获取客户端真实IP地址
 */
const getClientIP = (req) => {
  if (!req) return '127.0.0.1';

  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.ip ||
         (req.connection && req.connection.remoteAddress) ||
         (req.socket && req.socket.remoteAddress) ||
         (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
         '127.0.0.1';
};

/**
 * 获取地理位置信息（同步，reader 未就绪时返回"未知"）
 */
const getGeoLocation = (ip) => {
  // 本地 IP 返回默认位置
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: '中国', region: '北京市', city: '北京' };
  }

  if (!cityReader) {
    return { country: '未知', region: '未知', city: '未知' };
  }

  try {
    const result = cityReader.get(ip);
    if (!result) return { country: '未知', region: '未知', city: '未知' };

    const countryCode = result.country?.iso_code;
    const country = countryCode === 'CN' ? '中国'
      : (result.country?.names?.['zh-CN'] || result.country?.names?.en || countryCode || '未知');
    const region = result.subdivisions?.[0]?.names?.['zh-CN']
      || result.subdivisions?.[0]?.names?.en
      || result.subdivisions?.[0]?.iso_code
      || '未知';
    const city = result.city?.names?.['zh-CN']
      || result.city?.names?.en
      || '未知';

    return { country, region, city };
  } catch {
    return { country: '未知', region: '未知', city: '未知' };
  }
};

/**
 * 获取设备信息
 */
const getDeviceInfo = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser.name || 'Unknown',
    os: result.os.name || 'Unknown',
    deviceType: result.device.type || 'desktop'
  };
};

module.exports = {
  getClientIP,
  getGeoLocation,
  getDeviceInfo
};
