<script setup lang="ts">
import { useThemeStore } from '../stores/theme'
import { NButton } from 'naive-ui'

const themeStore = useThemeStore()
</script>

<template>
  <NButton @click="themeStore.toggleTheme">
    {{ themeStore.isDark ? '浅色模式' : '深色模式' }}
  </NButton>
</template>
