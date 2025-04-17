import { createDiscreteApi } from 'naive-ui'
import type { ConfigProviderProps } from 'naive-ui'
import { darkTheme, lightTheme } from 'naive-ui'
import { useThemeStore } from '@renderer/stores/theme'
import { computed } from 'vue'

// 创建一个单例的 API 实例
const api = createDiscreteApi(['message', 'dialog', 'notification', 'loadingBar'], {
  configProviderProps: computed<ConfigProviderProps>(() => ({
    theme: useThemeStore().theme === 'light' ? lightTheme : darkTheme
  }))
})

export const useNaiveDiscreteApi = () => {
  return {
    message: api.message,
    notification: api.notification,
    dialog: api.dialog,
    loadingBar: api.loadingBar
  }
}
