import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSite } from '../api/site.js'

const STORAGE_KEY = 'cms_locale'

export const useCmsLocaleStore = defineStore('cmsLocale', () => {
  // State
  const currentLocale = ref(localStorage.getItem(STORAGE_KEY) || '')
  const availableLocales = ref([])
  const defaultLocale = ref('zh')
  const loading = ref(false)
  const initialized = ref(false)

  // Computed
  const activeLocale = computed(() => {
    return currentLocale.value || defaultLocale.value || availableLocales.value[0] || 'zh'
  })

  // 初始化：从 API 加载站点语言配置
  const init = async () => {
    if (initialized.value) return

    loading.value = true
    try {
      const res = await getSite()
      if (res.code === 0) {
        const locales = res.data.locales
        if (typeof locales === 'string') {
          try { availableLocales.value = JSON.parse(locales) } catch { /* ignore */ }
        } else if (Array.isArray(locales)) {
          availableLocales.value = locales
        }

        defaultLocale.value = res.data.locale || 'zh'

        // 如果 localStorage 没有保存或保存的语言不在可用列表中，使用默认语言
        if (!currentLocale.value || !availableLocales.value.includes(currentLocale.value)) {
          currentLocale.value = defaultLocale.value
          localStorage.setItem(STORAGE_KEY, currentLocale.value)
        }

        initialized.value = true
      }
    } catch (e) {
      console.error('加载站点语言配置失败:', e)
      // 降级：使用默认值
      availableLocales.value = ['zh', 'en']
      defaultLocale.value = 'zh'
      if (!currentLocale.value) currentLocale.value = 'zh'
    } finally {
      loading.value = false
    }
  }

  // 切换当前语言
  const setLocale = (locale) => {
    if (availableLocales.value.includes(locale)) {
      currentLocale.value = locale
      localStorage.setItem(STORAGE_KEY, locale)
    }
  }

  // 刷新语言配置（site.vue 保存后调用）
  const refresh = async () => {
    initialized.value = false
    await init()
  }

  return {
    currentLocale,
    availableLocales,
    defaultLocale,
    activeLocale,
    loading,
    initialized,
    init,
    setLocale,
    refresh
  }
})
