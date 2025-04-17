<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useThemeStore } from '@renderer/stores/theme'
import { darkTheme, dateEnUS, dateZhCN, enUS, NGlobalStyle, zhCN } from 'naive-ui'
import { useLanguageStore } from '@renderer/stores/language'

const themeStore = useThemeStore()
const languageStore = useLanguageStore()

onMounted(() => {
  themeStore.initTheme()
})

const naiveLocale = computed(() => {
  return languageStore.language === 'zh' ? zhCN : enUS
})

const naiveDateLocale = computed(() => {
  return languageStore.language === 'zh' ? dateZhCN : dateEnUS
})
</script>

<template>
  <n-config-provider
    :theme="themeStore.theme === 'dark' ? darkTheme : null"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <n-notification-provider>
      <n-dialog-provider>
        <n-message-provider>
          <slot />
        </n-message-provider>
      </n-dialog-provider>
    </n-notification-provider>
    <n-global-style />
  </n-config-provider>
</template>
