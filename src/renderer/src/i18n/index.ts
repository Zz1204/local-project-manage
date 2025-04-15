import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zh from '../locales/zh.json'
import { useLanguageStore } from '../stores/language'

const i18n = createI18n({
  legacy: false,
  locale: 'zh', // 默认语言
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

export default i18n

// 初始化语言设置
export function initI18n(): void {
  const languageStore = useLanguageStore()
  i18n.global.locale.value = languageStore.language as 'zh' | 'en'
}
