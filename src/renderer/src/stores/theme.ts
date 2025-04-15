import { darkTheme, lightTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  function toggleTheme(): void {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    // 更新 HTML 的 class
    document.documentElement.classList.toggle('dark', isDark.value)
    setTheme(isDark.value)
    // 同步更新原生窗口暗黑模式
    window.api.setNativeTheme(isDark.value)
  }

  // 初始化主题
  function initTheme(): void {
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

  return {
    isDark,
    toggleTheme,
    initTheme
  }
})
