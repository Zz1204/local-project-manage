<script setup lang="ts">
import { useLanguageStore } from '../stores/language'

const languageStore = useLanguageStore()

const options = [
  {
    label: '中文',
    key: 'zh'
  },
  {
    label: 'English',
    key: 'en'
  }
]

function handleSelect(key: string): void {
  languageStore.setLanguage(key)
}
</script>

<template>
  <n-dropdown
    placement="bottom-start"
    trigger="click"
    size="small"
    :options="options"
    @select="handleSelect"
  >
    <div class="text-28px cursor-pointer uno-icon:ion:language"></div>
  </n-dropdown>
</template>
