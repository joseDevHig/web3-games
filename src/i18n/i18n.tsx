import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Importar archivos de traducción
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
// import it from "./locales/it/translation.json";
import tr from "./locales/tr/translation.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      // it: { translation: it },
      tr: { translation: tr },
    },
    lng: "es", 
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
