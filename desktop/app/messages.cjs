const zh = require('../i18n/locales/zh-CN.json');
const en = require('../i18n/locales/en.json');

function normalizeLocale(value) {
  return String(value ?? '')
    .toLowerCase()
    .startsWith('zh')
    ? 'zh-CN'
    : 'en';
}

function message(locale, key) {
  const table = normalizeLocale(locale) === 'zh-CN' ? zh : en;
  return table.desktop?.[key] ?? en.desktop?.[key] ?? key;
}

module.exports = { normalizeLocale, message };
