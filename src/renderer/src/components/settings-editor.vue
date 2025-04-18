<script setup lang="tsx">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'
import { useNaiveDiscreteApi } from '../composables/useNaiveDiscreteApi'
import type { Editor } from '../types/editor'
import { NSpace, NButton, FormInst } from 'naive-ui'

const { t } = useI18n()
const { message, dialog } = useNaiveDiscreteApi()
const editorStore = useEditorStore()

const editors = ref<Editor[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const formRef = ref<FormInst | null>(null)
// 表单数据
const formData = ref({
  displayName: '',
  executablePath: '',
  commandArgs: '',
  isDefault: false
})

// 使用 i18n 翻译的表单验证规则
const rules = computed(() => ({
  displayName: [{ required: true, message: t('settings.editor.displayNamePlaceholder') }],
  executablePath: [{ required: true, message: t('settings.editor.executablePathPlaceholder') }],
  commandArgs: [{ required: false, message: t('settings.editor.commandArgsPlaceholder') }]
}))

// 编辑模式
const isEditing = ref(false)
const editType = ref<'create' | 'update'>('create')
const editingId = ref<number | null>(null)

// 计算属性：模态框标题
const modalTitle = computed(() =>
  editType.value === 'create' ? t('settings.editor.createEditor') : t('settings.editor.editEditor')
)

// 表格列
const columns = computed(() => [
  { title: t('settings.editor.displayName'), key: 'displayName', width: 120 },
  {
    title: t('settings.editor.executablePath'),
    key: 'executablePath',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: t('settings.editor.commandArgs'),
    key: 'commandArgs',
    width: 140,
    ellipsis: { tooltip: true }
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    render: (row) => {
      return [
        <NSpace>
          <NButton
            size="tiny"
            onClick={() => handleEdit(row)}
            v-slots={{
              icon: () => <div class="uno-icon:material-symbols:edit " />
            }}
          ></NButton>
          <NButton
            size="tiny"
            type="error"
            onClick={() => handleDelete(row.id)}
            v-slots={{
              icon: () => <div class="uno-icon:material-symbols:delete text-white" />
            }}
          ></NButton>
        </NSpace>
      ]
    }
  }
])

// 加载编辑器列表
async function loadEditors() {
  try {
    isLoading.value = true
    error.value = null
    await editorStore.fetchEditors()
    editors.value = editorStore.editors
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.editor.loadEditorsFailed')
    message.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 扫描本地编辑器
async function handleScan() {
  try {
    isLoading.value = true
    error.value = null
    const result = await editorStore.scanLocalEditors()
    if (result.success) {
      message.success(t('settings.editor.scanSuccess'))
      await loadEditors()
    } else {
      message.error(t('settings.editor.scanFailed'))
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.editor.scanFailed')
    message.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 选择可执行文件
async function handleSelectExecutable() {
  try {
    const result = await window.electron.ipcRenderer.invoke('dialog:showOpenDialog', {
      properties: ['openFile'],
      filters: [{ name: 'Executable', extensions: ['exe', 'app', ''] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      formData.value.executablePath = result.filePaths[0]
    }
  } catch (err) {
    message.error(t('settings.editor.selectFileFailed'))
  }
}

// 创建编辑器
async function handleCreate() {
  editType.value = 'create'
  isEditing.value = true
  editingId.value = null
  formData.value = {
    displayName: '',
    executablePath: '',
    commandArgs: '',
    isDefault: false
  }
}
// 提交表单
async function handleSubmit() {
  try {
    error.value = null

    const valid = await formRef.value?.validate()
    if (!valid) {
      return
    }

    let result
    if (isEditing.value && editingId.value) {
      const editor: Editor = {
        id: editingId.value,
        displayName: formData.value.displayName,
        executablePath: formData.value.executablePath,
        commandArgs: formData.value.commandArgs,
        isDefault: formData.value.isDefault,
        createdAt: 0,
        updatedAt: 0
      }
      result = await editorStore.updateEditor(editor)
    } else {
      result = await editorStore.createEditor(formData.value)
    }
    if (result.success) {
      message.success(
        editType.value === 'create'
          ? t('settings.editor.createSuccess')
          : t('settings.editor.updateSuccess')
      )
      await loadEditors()
      resetForm()
    } else {
      message.error(
        editType.value === 'create'
          ? t('settings.editor.createFailed')
          : t('settings.editor.updateFailed')
      )
    }
  } finally {
    isLoading.value = false
  }
}

// 删除编辑器
async function handleDelete(id: number) {
  try {
    dialog.warning({
      title: t('settings.editor.confirmDelete'),
      content: t('settings.editor.confirmDeleteContent'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      onPositiveClick: async () => {
        isLoading.value = true
        error.value = null
        const result = await editorStore.deleteEditor(id)
        if (result.success) {
          message.success(t('settings.editor.deleteSuccess'))
          await loadEditors()
        }
      }
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.editor.deleteFailed')
    message.error(error.value)
  } finally {
    isLoading.value = false
  }
}

// 编辑编辑器
function handleEdit(editor: Editor) {
  editType.value = 'update'
  isEditing.value = true
  editingId.value = editor.id
  formData.value = {
    displayName: editor.displayName,
    executablePath: editor.executablePath,
    commandArgs: editor.commandArgs,
    isDefault: editor.isDefault
  }
}

// 重置表单
function resetForm() {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    displayName: '',
    executablePath: '',
    commandArgs: '',
    isDefault: false
  }
}

onMounted(() => {
  loadEditors()
})
</script>

<template>
  <div>
    <n-card :title="t('settings.editor.title')">
      <template #header-extra>
        <n-space>
          <n-button size="small" type="primary" @click="handleCreate" :loading="isLoading">
            {{ t('settings.editor.createEditor') }}
          </n-button>
          <n-button size="small" type="primary" @click="handleScan" :loading="isLoading">
            {{ t('settings.editor.scanLocalEditors') }}
          </n-button>
        </n-space>
      </template>

      <n-data-table
        size="small"
        :columns="columns"
        :data="editors"
        :loading="isLoading"
        :row-key="(row) => row.id"
      />
    </n-card>

    <n-modal v-model:show="isEditing" :style="{ width: '440px' }">
      <n-card :title="modalTitle">
        <n-form
          :model="formData"
          size="small"
          label-placement="left"
          label-width="auto"
          require-mark-placement="left"
          :rules="rules"
          ref="formRef"
        >
          <n-form-item :label="t('settings.editor.displayName')" path="displayName">
            <n-input
              v-model:value="formData.displayName"
              :placeholder="t('settings.editor.displayNamePlaceholder')"
            />
          </n-form-item>
          <n-form-item :label="t('settings.editor.executablePath')" path="executablePath">
            <n-input-group>
              <n-input
                v-model:value="formData.executablePath"
                :placeholder="t('settings.editor.executablePathPlaceholder')"
              />
              <n-button @click="handleSelectExecutable">{{ t('common.selectFile') }}</n-button>
            </n-input-group>
          </n-form-item>
          <n-form-item :label="t('settings.editor.commandArgs')" path="commandArgs">
            <n-input
              v-model:value="formData.commandArgs"
              :placeholder="t('settings.editor.commandArgsPlaceholder')"
            />
          </n-form-item>
          <n-form-item class="flex justify-end">
            <n-space>
              <n-button type="primary" @click="handleSubmit" :loading="isLoading">
                {{ editType === 'create' ? t('common.create') : t('common.update') }}
              </n-button>
              <n-button @click="resetForm">{{ t('common.cancel') }}</n-button>
            </n-space>
          </n-form-item>
        </n-form>
      </n-card>
    </n-modal>
  </div>
</template>
