import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import de from "./locales/de.json";
import en from "./locales/en.json";
import landingDe from "./locales/landing/de.json";
import landingEn from "./locales/landing/en.json";

const resources = {
  en: {
    translation: en,
    util: en.util || {},
    global: en.global || {},
    languages: en.languages || {},
    landing: landingEn,
  },
  de: {
    translation: de,
    util: de.util || {},
    global: de.global || {},
    languages: de.languages || {},
    landing: landingDe,
  },
};

const i18n = i18next.createInstance();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    ns: ["translation", "util", "global", "languages", "landing"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 