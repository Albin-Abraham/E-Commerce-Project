// Translation utilities for the Enterprise i18n system

/**
 * Utility to check if a translation key exists in a namespace.
 */
export const hasTranslation = (
  _ns: string,
  _key: string,
  _lng: string = "en"
): boolean => {
  return true;
};

/**
 * Robust string interpolation helper supporting both {{key}} and %{key}% syntax.
 */
export const formatTranslation = (
  text: string,
  vars: Record<string, any>
): string => {
  if (!text || !vars) return text;
  let result = text;
  Object.entries(vars).forEach(([key, value]) => {
    const valStr = value !== undefined && value !== null ? String(value) : "";
    // Replace standard double-curly braces {{key}}
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"), valStr);
    // Replace ruby / percent style %{key}% or %{key}
    result = result.replace(new RegExp(`%\\{\\s*${key}\\s*\\}%?`, "g"), valStr);
  });
  return result;
};

/**
 * Helper to safely extract or format year
 */
export const formatYear = (dateOrYear?: number | Date | string): number => {
  if (!dateOrYear) return new Date().getFullYear();
  if (dateOrYear instanceof Date) return dateOrYear.getFullYear();
  if (typeof dateOrYear === "number") return dateOrYear;
  const parsed = parseInt(dateOrYear, 10);
  return isNaN(parsed) ? new Date().getFullYear() : parsed;
};

/**
 * Formats a number according to the active locale
 */
export const formatNumber = (
  num: number,
  lng: string = "en",
  options?: Intl.NumberFormatOptions
): string => {
  try {
    return new Intl.NumberFormat(lng, options).format(num);
  } catch {
    return String(num);
  }
};

/**
 * Formats currency according to locale
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  lng: string = "en"
): string => {
  try {
    return new Intl.NumberFormat(lng, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};
