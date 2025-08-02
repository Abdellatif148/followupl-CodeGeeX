import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import en from '../locales/en.json'
import fr from '../locales/fr.json'
import es from '../locales/es.json'
import de from '../locales/de.json'
import it from '../locales/it.json'
import hi from '../locales/hi.json'

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  it: { translation: it },
  hi: { translation: hi }
}

// Language configuration (includes Hindi)
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' }
] as const

// Get language direction
export const getLanguageDirection = (language: string): 'ltr' | 'rtl' => {
  const lang = languages.find(l => l.code === language)
  return lang?.dir || 'ltr'
}

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'followuply-language'
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: false
    }
  })
  .catch((error) => {
    console.error('Error initializing i18n:', error)
  })

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  const direction = getLanguageDirection(lng)
  document.documentElement.dir = direction
  document.documentElement.lang = lng
  
  // Update CSS classes for RTL support
  if (direction === 'rtl') {
    document.documentElement.classList.add('rtl')
  } else {
    document.documentElement.classList.remove('rtl')
  }
})

// Set initial direction
const currentLang = i18n.language || 'en'
const initialDirection = getLanguageDirection(currentLang)
document.documentElement.dir = initialDirection
document.documentElement.lang = currentLang

if (initialDirection === 'rtl') {
  document.documentElement.classList.add('rtl')
}

export default i18n