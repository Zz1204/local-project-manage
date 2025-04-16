import { darkTheme, lightTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  // 从数据库加载主题设置
  async function loadTheme(): Promise<void> {
    try {
      const themeValue = await window.api.settings.get('theme')
      isDark.value = themeValue === 'dark'
    } catch (error) {
      console.error('加载主题设置失败:', error)
      // 如果数据库中没有设置，则使用默认值
      isDark.value = false
    }
  }

  // 切换主题
  async function toggleTheme(): Promise<void> {
    isDark.value = !isDark.value
    try {
      await window.api.settings.set('theme', isDark.value ? 'dark' : 'light')
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
    // 更新 HTML 的 class
    document.documentElement.classList.toggle('dark', isDark.value)
    setTheme(isDark.value)
    // 同步更新原生窗口暗黑模式
    window.api.setNativeTheme(isDark.value)
  }

  // 初始化主题
  async function initTheme(): Promise<void> {
    await loadTheme()
    document.documentElement.classList.toggle('dark', isDark.value)
    setTheme(isDark.value)
    // 初始化时同步原生窗口暗黑模式
    window.api.setNativeTheme(isDark.value)
  }

  function setTheme(dark: boolean): void {
    // 将主题变量添加到body的CSS变量中
    const cssVars = dark ? darkTheme.common : lightTheme.common

    for (const key in cssVars) {
      document.body.style.setProperty(`--n-${key}`, cssVars[key])
    }
  }

  // 组件挂载时加载主题设置
  onMounted(() => {
    loadTheme()
  })

  return {
    isDark,
    toggleTheme,
    initTheme
  }
})
