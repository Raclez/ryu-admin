

/**
 * 格式化日期
 * @param {number|string|Date} timestamp 时间戳或日期对象
 * @param {string} format 格式模板，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取相对时间描述
 * @param {number|string|Date} timestamp 时间戳或日期对象
 * @returns {string} 相对时间描述，如"刚刚"、"5分钟前"、"2小时前"等
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) {
    return '-';
  }

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const now = new Date();
  const diff = now - date;

  // 转换为秒
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return '刚刚';
  }

  // 转换为分钟
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  // 转换为小时
  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}小时前`;
  }

  // 转换为天
  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}天前`;
  }

  // 转换为月
  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months}个月前`;
  }

  // 转换为年
  const years = Math.floor(months / 12);

  return `${years}年前`;
}
