<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="h-screen">
    <n-tabs placement="left" type="line" class="h-full">
      <n-tab-pane name="common" :tab="t('settings.common')"> Wonderwall </n-tab-pane>
      <n-tab-pane name="idea" :tab="t('settings.idea')"> Wonderwall3 </n-tab-pane>
    </n-tabs>
  </div>
</template>
