import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * ZENITH EAGER-LOADING ARCHITECTURE
 *
 * All translation files are bundled at boot time.
 * Zero on-the-fly network requests for localization.
 * English (`en`) serves as authoritative fallback for all namespaces.
 */

// 1. Scan for all translation files (Deep support)
const enModules = import.meta.glob("./en/**/index.json", {
  eager: true,
  import: "default",
});
const generatedModules = import.meta.glob("./generated/**/index.json", {
  eager: true,
  import: "default",
});

const resources: Record<string, Record<string, any>> = {};

/**
 * Merges a translation file into the resources object based on its deep path.
 * Registers both full slash namespaces (`layouts/navigation`), colon namespaces (`layouts:navigation`),
 * and intuitive leaf namespaces (`navigation`, `dashboard`, `workspace`, etc.).
 */
function mergeResource(
  lng: string,
  path: string,
  content: any,
  baseDir: string
) {
  const relativePath = path.replace(baseDir, "").replace("/index.json", "");
  const parts = relativePath.split("/").filter(Boolean); // [category, sub1, sub2, ...]

  if (!resources[lng]) resources[lng] = {};

  const slashNamespace = parts.join("/");
  const colonNamespace = parts.join(":");
  const leafNamespace = parts[parts.length - 1];

  // Helper to assign into resources
  const assignNS = (ns: string, val: any) => {
    if (!resources[lng][ns]) {
      resources[lng][ns] = { ...val };
    } else {
      Object.assign(resources[lng][ns], val);
    }
  };

  assignNS(slashNamespace, content);
  assignNS(colonNamespace, content);

  if (leafNamespace && leafNamespace !== slashNamespace) {
    assignNS(leafNamespace, content);
  }

  // Common umbrella alias
  if (parts[0] === "common") {
    assignNS("common", content);
  }
}

// 2. Process English (Source of Truth)
Object.entries(enModules).forEach(([path, content]) => {
  mergeResource("en", path, content, "./en/");
});

// 3. Process Generated Translations
Object.entries(generatedModules).forEach(([path, content]) => {
  const parts = path.replace("./generated/", "").split("/");
  const lng = parts[0];
  const newBaseDir = `./generated/${lng}/`;
  mergeResource(lng, path, content, newBaseDir);
});

// 4. RTL Detection
const RTL_LANGUAGES = ["ar", "he", "fa", "ur"];

const updateDirection = (lng: string) => {
  const isRTL = RTL_LANGUAGES.includes(lng.split("-")[0]);
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lng;
};

// 5. Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    defaultNS: "common/base",
    fallbackNS: ["common/base", "common", "layouts/navigation", "screens/dashboard"],
    returnEmptyString: false,
    returnNull: false,
    interpolation: {
      escapeValue: false,
      prefix: "{{",
      suffix: "}}",
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      caches: ["localStorage", "cookie"],
    },
  });

i18n.on("languageChanged", (lng) => {
  updateDirection(lng);
});

updateDirection(i18n.language || "en");

export default i18n;
