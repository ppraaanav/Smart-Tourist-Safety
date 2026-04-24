import en from './en.json';
import es from './es.json';

const translations = { en, es };

export const getTranslation = (lang = 'en') => {
  return translations[lang] || translations.en;
};

export const t = (key, lang = 'en') => {
  const dict = translations[lang] || translations.en;
  return dict[key] || key;
};

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

export default translations;
