import { defineStore } from 'pinia'
import { ref, onMounted, watch } from 'vue'
import i18n from '../i18n'

export const useLanguageStore = defineStore('language', () => {
  const language = ref('zh')

  // 从数据库加载语言设置
  async function loadLanguage(): Promise<void> {
    try {
      const langValueSettings = await window.api.settings.get('language')
      if (langValueSettings) {
        language.value = langValueSettings
      }
    } catch (error) {
      console.error('加载语言设置失败:', error)
      // 如果数据库中没有设置，则使用默认值
      language.value = 'zh'
    }
  }

  watch(
    () => language.value,
    async (newVal) => {
      // 更新 i18n locale
      i18n.global.locale.value = newVal as 'zh' | 'en'
      await window.api.settings.set('language', newVal)
    }
  )

  // 设置语言
  async function setLanguage(lang: string): Promise<void> {
    language.value = lang
    try {
      await window.api.settings.set('language', lang)
    } catch (error) {
      console.error('保存语言设置失败:', error)
    }
    // 更新 i18n locale
    // i18n.global.locale.value = lang as 'zh' | 'en'
  }

  // 初始化语言
  async function initLanguage(): Promise<void> {
    try {
      // 先尝试从数据库加载语言设置
      await loadLanguage()

      // 如果数据库中没有设置，则使用系统语言
      if (!language.value) {
        const systemLanguage = await window.api.getSystemLanguage()
        // 如果系统语言是中文，则使用中文，否则使用英文
        const lang = systemLanguage.startsWith('zh') ? 'zh' : 'en'
        await setLanguage(lang)
      } else {
        await setLanguage(language.value)
      }
    } catch (error) {
      console.error('初始化语言失败:', error)
    }
  }

  // 组件挂载时初始化语言
  onMounted(() => {
    initLanguage()
  })

  return {
    language,
    setLanguage,
    initLanguage
  }
})
