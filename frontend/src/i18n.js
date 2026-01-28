import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationCS from './locales/cs.json';
import translationEN from './locales/en.json';
import translationUK from './locales/uk.json';

const resources = {
  cs: { translation: translationCS },
  en: { translation: translationEN },
  uk: { translation: translationUK }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "cs", // початкова мова
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;