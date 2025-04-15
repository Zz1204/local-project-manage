<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@renderer/stores/theme'
import { darkTheme, NGlobalStyle } from 'naive-ui'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <n-config-provider :theme="themeStore.isDark ? darkTheme : null">
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
