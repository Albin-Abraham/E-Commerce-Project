import i18n from "@i18n/i18n";

function interpolateString(
  template: string,
  params?: Record<string, any>
): string {
  if (!params || !template || typeof template !== "string") return template;
  const formatVal = (val: unknown) =>
    typeof val === "number" ? val.toLocaleString() : String(val);

  return template
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) =>
      params[key] !== undefined ? formatVal(params[key]) : match
    )
    .replace(/\{\s*([\w.]+)\s*\}/g, (match, key) =>
      params[key] !== undefined ? formatVal(params[key]) : match
    );
}

/**
 * resolveTranslation: The Semantic Bridge
 *
 * Bridges the Form Engine's schema-driven TranslatedText objects with
 * the global react-i18next dictionary and supports dynamic interpolation parameters.
 *
 * @param value - Either a constant string key (e.g. "forms:onboarding.title"),
 *                a TranslatedText object (e.g. { en: "Name", es: "Nombre" }),
 *                or a raw literal with optional {{tokens}}.
 * @param defaultNamespace - Namespace to use if key string doesn't have one (defaults to 'features/forms').
 * @param params - Optional interpolation parameters (e.g. { domain_name: "Inventory" }).
 * @returns The resolved and interpolated string based on the active locale.
 */
export function resolveTranslation(
  value: any,
  defaultNamespace: string = "features/forms",
  params?: Record<string, any>
): string {
  if (!value) return "";

  // Handle arrays (e.g. some fields might pass multiple strings or objects)
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveTranslation(item, defaultNamespace, params))
      .join(" ");
  }

  // 1. Literal / Key Resolution
  if (typeof value === "string") {
    let resolved = value;
    // If it's explicitly namespaced (contains ':') we use it as is
    if (value.includes(":")) {
      resolved = i18n.t(value, { ...params, defaultValue: value });
    } else {
      // Industrial Resolution: The defaultNamespace is now a direct mapping to the directory-based namespace (e.g. 'features:forms')
      resolved = i18n.t(value, {
        ns: defaultNamespace,
        defaultValue: value,
        ...params,
      });
    }
    return interpolateString(resolved, params);
  }

  // 2. Embedded Object Resolution (TranslatedText)
  const currentLang = i18n.language || "en";
  let rawText = "";

  // Try exact match (e.g. "en-US" or "es")
  if (value[currentLang]) {
    rawText = value[currentLang] as string;
  } else {
    // Try language-only match (e.g. "en" if current is "en-US")
    const langOnly = currentLang.split("-")[0];
    if (value[langOnly]) {
      rawText = value[langOnly] as string;
    } else {
      // Final Fallback: First available fallback language -> first available key -> empty
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
