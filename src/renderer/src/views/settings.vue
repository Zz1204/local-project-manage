<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SettingsCommon from '@renderer/components/settings-common.vue'
import SettingsIdea from '@renderer/components/settings-idea.vue'
const { t } = useI18n()
</script>

<template>
  <div class="h-screen">
    <n-tabs placement="left" type="line" class="h-full w-full">
      <n-tab-pane name="common" :tab="t('settings.common')">
        <div class="p-r-12px py-12px">
          <SettingsCommon />
        </div>
      </n-tab-pane>
      <n-tab-pane name="idea" :tab="t('settings.idea')">
        <div class="p-r-12px py-12px">
          <SettingsIdea />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
