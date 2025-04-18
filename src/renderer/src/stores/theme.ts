import { darkTheme, lightTheme } from 'naive-ui'
import { defineStore } from 'pinia'
import { ref, onMounted, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'light' | 'dark'>('light')

  // 从数据库加载主题设置
  async function loadTheme(): Promise<void> {
    try {
      const themeValue = await window.api.settings.get('theme')
      if (themeValue) {
        theme.value = themeValue === 'dark' ? 'dark' : 'light'
      } else {
        // 如果数据库中没有设置，则使用系统主题
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        theme.value = systemTheme
        // 保存系统主题到数据库
        try {
          await window.api.settings.set('theme', theme.value)
        } catch (error) {
          console.error('保存系统主题设置失败:', error)
        }
      }
    } catch (error) {
      console.error('加载主题设置失败:', error)
      // 如果加载失败，使用系统主题
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      theme.value = systemTheme
    }
  }

  // 切换主题
  async function toggleTheme(): Promise<void> {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    try {
      await window.api.settings.set('theme', theme.value)
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
    // 更新 HTML 的 class
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    // 同步更新原生窗口暗黑模式
    window.api.setNativeTheme(theme.value === 'dark')
  }

  // 设置主题
  async function setThemeMode(mode: 'light' | 'dark'): Promise<void> {
    theme.value = mode
    try {
      await window.api.settings.set('theme', theme.value)
    } catch (error) {
      console.error('保存主题设置失败:', error)
    }
    // 更新 HTML 的 class
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    // 同步更新原生窗口暗黑模式
    window.api.setNativeTheme(theme.value === 'dark')
  }

  // 初始化主题
  async function initTheme(): Promise<void> {
    await loadTheme()
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    setTheme(theme.value)
    // 初始化时同步原生窗口暗黑模式
    window.api.setNativeTheme(theme.value === 'dark')
  }

  watch(
    () => theme.value,
    (newTheme) => {
      setTheme(newTheme)
    }
  )

  function setTheme(mode: 'light' | 'dark'): void {
    // 将主题变量添加到body的CSS变量中
    const cssVars = mode === 'dark' ? darkTheme.common : lightTheme.common

    for (const key in cssVars) {
      document.body.style.setProperty(`--n-${key}`, cssVars[key])
    }
  }

  // 组件挂载时加载主题设置
  onMounted(() => {
    loadTheme()
  })

  return {
    theme,
    toggleTheme,
    setThemeMode,
    initTheme
  }
})
