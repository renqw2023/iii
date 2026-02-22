const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

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
 * 获取地理位置信息
 */
const getGeoLocation = (ip) => {
  // 如果是本地IP，返回默认位置
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      country: '中国',
      region: '北京市',
      city: '北京'
    };
  }
  
  const geo = geoip.lookup(ip);
  if (geo) {
    return {
      country: geo.country === 'CN' ? '中国' : geo.country,
      region: geo.region || '未知',
      city: geo.city || '未知'
    };
  }
  
  return {
    country: '未知',
    region: '未知',
    city: '未知'
  };
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