export type Language = "en" | "bn";

export const isLanguage = (value: string | undefined): value is Language =>
  value === "en" || value === "bn";

export const resolveLanguage = (value: string | undefined): Language =>
  isLanguage(value) ? value : "en";

export const withLang = (href: string, language: Language) => {
  if (language === "en") {
    return href;
  }

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}lang=${language}`;
};
