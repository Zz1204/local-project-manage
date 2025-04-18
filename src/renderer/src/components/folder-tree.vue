<script setup lang="tsx">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFolderStore } from '../stores/folder'
import { NButton, NTree, NInput, NPopconfirm } from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { VNode } from 'vue'
import { useFolderEdit } from '../composables/useFolderEdit'
import FolderIcon from './FolderIcon.vue'

const { t } = useI18n()
const folderStore = useFolderStore()
const {
  editingName,
  editingFolderId,
  inputRef,
  startEdit,
  saveEdit,
  cancelEdit,
  addSubFolder,
  addRootFolder,
  deleteFolder
} = useFolderEdit()

// 树形数据
const treeData = computed(() => {
  return folderStore.folderTree
})
const selectedKeys = ref<string[]>([])
const expandKeys = ref<number[]>([])

// 展开的key
function handleExpandKeys(keys: number[]): void {
  expandKeys.value = keys
}

// 初始化加载数据
onMounted(async () => {
  await folderStore.loadFolders()
})

// 处理选择
function handleSelect(keys: string[]): void {
  if (keys.length === 0) return
  console.log('Folder selected:', keys)
  // selectedKeys.value = keys
  if (keys.length > 0) {
    folderStore.setSelectedFolder(parseInt(keys[0]))
  } else {
    folderStore.setSelectedFolder(null)
  }
}

// 监听store中的编辑标记
watch(
  () => folderStore.editingFolderId,
  (newFolder) => {
    newFolder && startEdit(newFolder)
  }
)

// 刷新树
async function handleRefresh(): Promise<void> {
  await folderStore.loadFolders()
}

// 渲染树节点
function renderTreeLabel({ option }: { option: TreeOption }): VNode {
  const key = option.key as number
  const isEditing = editingFolderId.value === key

  if (isEditing) {
    return (
      <NInput
        ref={inputRef}
        size="tiny"
        value={editingName.value}
        onUpdateValue={(val: string) => (editingName.value = val)}
        onBlur={saveEdit}
        onKeydown={(e: { key: string }) => {
          if (e.key === 'Enter') {
            saveEdit()
          }
          if (e.key === 'Escape') {
            cancelEdit()
          }
        }}
        placeholder={t('folder.folderName')}
      />
    )
  }

  return (
    <div class="flex items-center justify-between group">
      <div class="flex-1 min-w-0 truncate">{option.label}</div>

      <div
        class="items-center gap-8px hidden group-hover:flex text-18px"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          class="uno-icon:material-symbols:create-new-folder-outline-rounded text-successColor"
          onClick={() => addSubFolder(key, expandKeys.value)}
        ></div>
        <div
          class="uno-icon:material-symbols:edit text-primaryColor"
          onClick={() => startEdit(key)}
        ></div>

        <NPopconfirm
          onPositiveClick={() => deleteFolder(key)}
          v-slots={{
            trigger: () => <div class="uno-icon:material-symbols:delete text-errorColor" />,
            default: () => t('folder.deleteFolder')
          }}
        ></NPopconfirm>
      </div>
    </div>
  )
}

function renderSwitcherIconWithExpaned({ expanded }: { expanded: boolean }) {
  return <FolderIcon expanded={expanded} />
}
</script>

<template>
  <div class="project-tree h-full flex flex-col">
    <div
      class="h-48px px-16px flex items-center justify-between b-b-1px b-b-solid b-b-dividerColor"
    >
      <div class="font-bold text-16px">{{ t('folder.folderList') }}</div>
      <div class="flex items-center gap-8px">
        <NButton type="primary" size="tiny" @click="handleRefresh">
          <template #icon>
            <div class="uno-icon:material-symbols:refresh"></div>
          </template>
        </NButton>
        <NButton type="primary" size="tiny" @click="addRootFolder">
          <template #icon>
            <div class="uno-icon:material-symbols:add"></div>
          </template>
        </NButton>
      </div>
    </div>

    <div class="flex-1 min-h-0">
      <template v-if="treeData.length > 0">
        <n-scrollbar style="height: 100%">
          <div class="p-x-16px">
            <NTree
              block-line
              show-line
              virtual-scroll
              :default-expand-all="true"
              :data="treeData"
              :selected-keys="folderStore.selectedFolderId ? [folderStore.selectedFolderId] : []"
              :expanded-keys="expandKeys"
              :on-update:expanded-keys="handleExpandKeys"
              :render-label="renderTreeLabel"
              :render-switcher-icon="renderSwitcherIconWithExpaned"
              @update:selected-keys="handleSelect"
            />
          </div>
        </n-scrollbar>
      </template>
      <template v-else>
        <div class="h-full flex items-center justify-center">
          <n-empty size="large" />
        </div>
      </template>
    </div>
  </div>
</template>
