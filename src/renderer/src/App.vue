<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useThemeStore } from './stores/theme'
import ThemeSwitch from './components/ThemeSwitch.vue'
import { darkTheme, lightTheme, NGlobalStyle } from 'naive-ui'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})

watch(
  () => themeStore.isDark,
  (val) => {
    // 将主题变量添加到body的CSS变量中
    const cssVars = val ? darkTheme.common : lightTheme.common

    for (const key in cssVars) {
      document.body.style.setProperty(`--n-${key}`, cssVars[key])
    }
  },
  { immediate: true }
)
</script>

<template>
  <n-config-provider :theme="themeStore.isDark ? darkTheme : null">
    <n-message-provider>
      <div class="min-h-100px" :class="{ dark: themeStore.isDark }">
        <nav class="p-4 flex justify-end">
          <ThemeSwitch />
        </nav>
        <router-view></router-view>
      </div>
    </n-message-provider>

    <n-global-style />
  </n-config-provider>
</template>

<style>
/* 全局样式 */
:root {
  --primary-color: #18a058;
}

.dark {
  --primary-color: #63e2b7;
}
</style>
