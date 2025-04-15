<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const treeData = ref([])
const selectedKeys = ref([])
</script>

<template>
  <div class="project-tree">
    <div class="mb-4 flex justify-between items-center">
      <div class="font-bold text-16px">{{ t('project.projectList') }}</div>
      <n-button type="primary" size="tiny">
        <template #icon>
          <div class="uno-icon:material-symbols:add"></div>
        </template>
      </n-button>
    </div>

    <n-tree :data="treeData" :selected-keys="selectedKeys" block-line />
  </div>
</template>
