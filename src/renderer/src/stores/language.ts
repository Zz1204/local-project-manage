import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import i18n from '../i18n'

export const useLanguageStore = defineStore('language', () => {
  const language = ref(localStorage.getItem('language') || 'zh')

  function setLanguage(lang: string): void {
    language.value = lang
    localStorage.setItem('language', lang)
    // 更新 i18n locale
    i18n.global.locale.value = lang as 'zh' | 'en'
  }

  async function initLanguage(): Promise<void> {
    try {
      const systemLanguage = await window.api.getSystemLanguage()
      // 如果系统语言是中文，则使用中文，否则使用英文
      const lang = systemLanguage.startsWith('zh') ? 'zh' : 'en'
      setLanguage(lang)
    } catch (error) {
      console.error('Failed to get system language:', error)
    }
  }

  onMounted(() => {
    initLanguage()
  })

  return {
    language,
    setLanguage,
    initLanguage
  }
})
