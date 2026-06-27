export function getLanguageDirection(language) {
  return language?.startsWith("ar") ? "rtl" : "ltr";
}

export function applyDocumentLanguage(language) {
  const resolved = language || "en";
  document.documentElement.lang = resolved;
  document.documentElement.dir = getLanguageDirection(resolved);
}
