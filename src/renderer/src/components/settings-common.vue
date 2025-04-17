<script setup lang="tsx">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguageStore } from '@renderer/stores/language'
import { useThemeStore } from '@renderer/stores/theme'
import { storeToRefs } from 'pinia'

const { t } = useI18n()

const languageStore = useLanguageStore()
const themeStore = useThemeStore()
const languageOptions = ref([
  { label: () => t('settings.zh'), value: 'zh' },
  { label: () => t('settings.en'), value: 'en' }
])

const themeOptions = ref([
  { label: () => t('common.lightMode'), value: 'light' },
  { label: () => t('common.darkMode'), value: 'dark' }
])

const { language } = storeToRefs(languageStore)
const { theme } = storeToRefs(themeStore)

const setThemeStore = (value: 'light' | 'dark') => {
  themeStore.setThemeMode(value)
}
</script>
<template>
  <n-card>
    <n-form>
      <n-form-item
        :label-style="{ fontSize: '16px', fontWeight: 'bold' }"
        :label="t('settings.language')"
        path="language"
      >
        <n-select v-model:value="language" :options="languageOptions"></n-select>
      </n-form-item>

      <n-form-item
        :label-style="{ fontSize: '16px', fontWeight: 'bold' }"
        :label="t('settings.theme')"
        path="theme"
      >
        <n-select v-model:value="theme" :options="themeOptions" @update:value="setThemeStore" />
      </n-form-item>
    </n-form>
  </n-card>
</template>
