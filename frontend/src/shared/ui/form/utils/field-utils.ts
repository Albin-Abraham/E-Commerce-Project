import type {
  Internationalization,
  TranslatedText,
} from "../types/i18n-accessibility";
import { resolveTranslation } from "./i18n.utils";

// Fallback for cn if not available
export function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function getI18nString(
  val: string | Internationalization | TranslatedText | undefined
): string {
  if (!val) return "";
  if (typeof val === "string") return resolveTranslation(val);

  // Check if it is TranslatedText (has 'en' key)
  if ("en" in val) {
    return resolveTranslation(val as TranslatedText);
  }

  // Fallback for Internationalization object
  const i18n = val as Internationalization;
  if (i18n.label) return resolveTranslation(i18n.label);
  if (i18n.placeholder) return resolveTranslation(i18n.placeholder);
  if (i18n.helpText) return resolveTranslation(i18n.helpText);

  // Absolute fallback
  return resolveTranslation(val);
}

export function getOptionLabel(val: string | Internationalization): string {
  if (typeof val === "string") return resolveTranslation(val);
  return resolveTranslation((val as Internationalization).label) || "Option";
}
