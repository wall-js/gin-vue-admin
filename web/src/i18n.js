import { createI18n } from 'vue-i18n'
import enLocale from './locales/en.json'
import zhLocale from './locales/zh.json'
import zhtwLocale from './locales/zh-TW.json'
import arLocale from './locales/ar.json'
import ruLocale from './locales/ru.json'
import Cookies from 'js-cookie'

// Base locale messages
const messages = {
  en: { ...enLocale },
  zh: { ...zhLocale },
  'zh-TW': { ...zhtwLocale },
  ar: { ...arLocale },
  ru: { ...ruLocale }
}

// Auto-discover plugin locale files: src/plugin/*/locales/<lang>.json
const pluginLocaleModules = import.meta.glob('./plugin/*/locales/*.json', { eager: true })

for (const [path, mod] of Object.entries(pluginLocaleModules)) {
  const match = path.match(/\/locales\/([\w-]+)\.json$/)
  if (!match) continue
  const lang = match[1]
  const data = mod.default || mod
  if (!messages[lang]) messages[lang] = {}
  Object.assign(messages[lang], data)
}

export default createI18n({
  legacy: false,
  globalInjection: true,
  locale: process.env.VUE_APP_I18N_LOCALE || Cookies.get('language') || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'zh',
  messages
})
