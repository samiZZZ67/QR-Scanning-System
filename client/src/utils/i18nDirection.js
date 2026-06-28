export function applyDocumentLanguage(lang) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', dir);
}
