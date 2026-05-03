import polyglotI18nProvider from 'ra-i18n-polyglot';
import chineseMessages from 'ra-language-chinese';

export const i18nProvider = polyglotI18nProvider(
  () => chineseMessages,
  'zh',
  [{ locale: 'zh', name: '中文' }],
);
