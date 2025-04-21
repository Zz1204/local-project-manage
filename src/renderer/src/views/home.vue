<script setup lang="ts">
import ThemeSwitch from '@renderer/components/theme-switch.vue'
import LanguageSwitch from '@renderer/components/language-switch.vue'
import Versions from '@renderer/components/Versions.vue'
import FolderTree from '@renderer/components/folder-tree.vue'
import ProjectList from '@renderer/components/project-list.vue'
import UpdateChecker from '@renderer/components/update-checker.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const openSetting = () => {
  window.api.window.openOrFocusRouteInWindow('/settings', 'settings', {
    width: 900,
    height: 500,
    minWidth: 900,
    minHeight: 500,
    title: t('common.settings')
  })
}
</script>

<template>
  <n-layout class="h-screen">
    <n-layout-header class="h-48px flex items-center justify-between px-16px" bordered>
      <div class="text-primaryColor text-24px font-bold">{{ t('common.title') }}</div>
      <div class="flex items-center gap-2">
        <update-checker />
        <theme-switch />
        <language-switch />
        <div class="flex items-center gap-2 cursor-pointer" @click="openSetting">
          <div class="text-28px uno-icon:material-symbols:settings-outline"></div>
        </div>
      </div>
    </n-layout-header>
    <n-layout position="absolute" class="top-48px! bottom-22px!" has-sider>
      <n-layout-sider content-style="height: 100%;" bordered>
        <folder-tree />
      </n-layout-sider>
      <n-layout>
        <project-list />
      </n-layout>
    </n-layout>
    <n-layout-footer position="absolute" class="h-22px flex items-center px-16px" bordered>
      <versions />
    </n-layout-footer>
  </n-layout>
</template>

<style scoped></style>
