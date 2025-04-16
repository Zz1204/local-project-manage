import { ref, nextTick } from 'vue'
import { useFolderStore } from '../stores/folder'
import { useI18n } from 'vue-i18n'

export function useFolderEdit() {
  const { t } = useI18n()
  const folderStore = useFolderStore()

  // 编辑状态
  const editingName = ref('')
  const editingDescription = ref('')
  const editingFolderId = ref<number | null>(null)
  const inputRef = ref<HTMLInputElement | null>(null)

  // 开始编辑文件夹
  function startEdit(key: number | null): void {
    editingFolderId.value = key

    const folder = folderStore.folders.find((folder) => folder.id === key)
    if (folder) {
      editingName.value = folder.name
      editingDescription.value = folder.description
    }

    if (key) {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.focus()
          inputRef.value.select()
        } else {
          setTimeout(() => {
            inputRef.value?.focus()
            inputRef.value?.select()
          }, 200)
        }
      })
    }
  }

  // 保存编辑
  async function saveEdit(): Promise<void> {
    if (editingFolderId.value !== null) {
      try {
        await folderStore.updateFolder(
          editingFolderId.value,
          editingName.value,
          editingDescription.value
        )
        editingFolderId.value = null
        folderStore.setEditingFolder(null)
      } catch (error) {
        console.error('更新文件夹失败:', error)
      }
    }
  }

  // 取消编辑
  function cancelEdit(): void {
    editingFolderId.value = null
    folderStore.setEditingFolder(null)
  }

  // 添加子文件夹
  async function addSubFolder(parentId: number, expandKeys: number[]): Promise<void> {
    try {
      editingName.value = t('folder.defaultName')
      if (!expandKeys.includes(parentId)) {
        expandKeys.push(parentId)
      }
      const result = await folderStore.createFolder(editingName.value, parentId)
      folderStore.setEditingFolder(result.lastInsertRowid)
    } catch (error) {
      console.error('添加文件夹失败:', error)
    }
  }

  // 添加根文件夹
  async function addRootFolder(): Promise<void> {
    try {
      editingName.value = t('folder.defaultName')
      const result = await folderStore.createFolder(editingName.value, null)
      startEdit(result.lastInsertRowid)
    } catch (error) {
      console.error('添加文件夹失败:', error)
    }
  }

  // 删除文件夹
  async function deleteFolder(id: number): Promise<void> {
    try {
      await folderStore.deleteFolder(id)
    } catch (error) {
      console.error('删除文件夹失败:', error)
    }
  }

  return {
    editingName,
    editingDescription,
    editingFolderId,
    inputRef,
    startEdit,
    saveEdit,
    cancelEdit,
    addSubFolder,
    addRootFolder,
    deleteFolder
  }
}
