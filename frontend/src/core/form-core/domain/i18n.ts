export interface TranslatedText {
  en?: string;
  [locale: string]: string | undefined;
}

export interface Internationalization {
  label?: TranslatedText;
  description?: TranslatedText;
  placeholder?: TranslatedText;
  tooltip?: TranslatedText;
  helpText?: TranslatedText;
  errorMessages?: Record<string, TranslatedText>;
}

export interface Accessibility {
  ariaLabel?: string | TranslatedText;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  role?: string;
  tabIndex?: number;
  keyboardShortcuts?: string[];
}
