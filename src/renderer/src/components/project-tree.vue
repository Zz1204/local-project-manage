<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const treeData = ref([])
const selectedKeys = ref([])

const handleAddProject = (): void => {
  window.api.window
    .openRouteInNewWindow('/project/add', {
      width: 400,
      height: 400,
      minWidth: 400,
      minHeight: 400,
      title: t('project.createProject'),
      resizable: false,
      movable: true,
      useContentSize: true
    })
    .then((success) => {
      if (success) {
        console.log('窗口创建成功')
      } else {
        console.error('窗口创建失败')
      }
    })
}
</script>

<template>
  <div class="project-tree">
    <div class="mb-4 flex justify-between items-center">
      <div class="font-bold text-16px">{{ t('project.projectList') }}</div>
      <n-button type="primary" size="tiny" @click="handleAddProject">
        <template #icon>
          <div class="uno-icon:material-symbols:add"></div>
        </template>
      </n-button>
    </div>

    <n-tree :data="treeData" :selected-keys="selectedKeys" block-line />
  </div>
</template>
