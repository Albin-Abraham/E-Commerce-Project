import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { FormDefinition } from "@ui/form/types";

export function useFormI18n(
  definition: FormDefinition<any>,
  setLocale: (locale: string) => void,
  locale?: string,
  i18nNamespace?: string
) {
  const { i18n: i18nInstance } = useTranslation(
    i18nNamespace || "features/forms"
  );

  useEffect(() => {
    const explicitLocale = definition.metadata?.locale || locale;
    if (explicitLocale && i18nInstance.language !== explicitLocale) {
      i18nInstance.changeLanguage(explicitLocale);
    }
    setLocale(i18nInstance.language);
  }, [definition, locale, i18nInstance.language, setLocale]);

  return { i18nInstance };
}
