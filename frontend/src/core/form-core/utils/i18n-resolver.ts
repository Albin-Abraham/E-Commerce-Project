import i18n from "@i18n/i18n";
import type { TranslatedText } from "../domain/i18n";

function interpolateString(
  template: string,
  params?: Record<string, any>
): string {
  if (!params || !template || typeof template !== "string") return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
    params[key] !== undefined ? String(params[key]) : match
  );
}

/**
 * resolveTranslation: Resolves TranslatedText objects or i18n keys
 * with the global react-i18next dictionary.
 */
export function resolveTranslation(
  value: string | TranslatedText | any,
  defaultNamespace: string = "features/forms",
  params?: Record<string, any>
): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value
      .map((item) => resolveTranslation(item, defaultNamespace, params))
      .join(" ");
  }

  if (typeof value === "string") {
    let resolved = value;
    if (value.includes(":")) {
      resolved = i18n.t(value, { ...params, defaultValue: value });
    } else {
      resolved = i18n.t(value, {
        ns: defaultNamespace,
        defaultValue: value,
        ...params,
      });
    }
    return interpolateString(resolved, params);
  }

  const currentLang = i18n.language || "en";
  let rawText = "";

  if (value[currentLang]) {
    rawText = value[currentLang] as string;
  } else {
    const langOnly = currentLang.split("-")[0];
    if (value[langOnly]) {
      rawText = value[langOnly] as string;
    } else {
      const fallbackLangs = Array.isArray(i18n.options.fallbackLng)
        ? i18n.options.fallbackLng
        : [i18n.options.fallbackLng || "en"];

      for (const lang of fallbackLangs) {
        const result = value[lang as string];
        if (typeof result === "string") {
          rawText = result;
          break;
        }
      }

      if (!rawText) {
        const absoluteFallback = Object.values(value)[0];
        rawText = typeof absoluteFallback === "string" ? absoluteFallback : "";
      }
    }
  }

  return interpolateString(rawText, params);
}
