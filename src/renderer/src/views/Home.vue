<script setup lang="ts">
import ThemeSwitch from '@renderer/components/theme-switch.vue'
import LanguageSwitch from '@renderer/components/language-switch.vue'
import Versions from '@renderer/components/versions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <n-layout class="h-screen">
    <n-layout-header class="h-48px flex items-center justify-between px-16px" bordered>
      <div class="text-primaryColor text-24px font-bold">{{ t('common.title') }}</div>
      <div class="flex items-center gap-2">
        <theme-switch />
        <language-switch />
      </div>
    </n-layout-header>
    <n-layout position="absolute" class="top-48px! bottom-22px!" has-sider>
      <n-layout-sider
        content-style="padding: 16px;height: 100%;"
        :native-scrollbar="false"
        bordered
      >
        <project-tree />
      </n-layout-sider>
      <n-layout content-style="padding: 24px;" :native-scrollbar="false">
        <n-h2>平山道</n-h2>
      </n-layout>
    </n-layout>
    <n-layout-footer position="absolute" class="h-22px flex items-center px-16px" bordered>
      <versions />
    </n-layout-footer>
  </n-layout>
</template>

<style scoped></style>
