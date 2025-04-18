import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Folder, FolderOperationResult } from '../types/folder'
import { TreeOption } from 'naive-ui'

export const useFolderStore = defineStore('folder', () => {
  // 状态
  const folders = ref<Folder[]>([])
  const selectedFolderId = ref<number | null>(null)
  const editingFolderId = ref<number | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性
  const folderTree = computed<TreeOption[]>(() => {
    const buildTree = (parentId: number | null): TreeOption[] => {
      return folders.value
        .filter((folder) => folder.parent_id === parentId)
        .map((folder) => ({
          ...folder,
          key: folder.id,
          label: folder.name,
          children: buildTree(folder.id),
          isLeaf: buildTree(folder.id).length === 0
        }))
    }
    return buildTree(null)
  })

  // 获取当前选中的文件夹
  const selectedFolder = computed<Folder | null>(() => {
    if (selectedFolderId.value === null) return null
    return folders.value.find((folder) => folder.id === selectedFolderId.value) || null
  })

  // 获取当前编辑的文件夹
  const editingFolder = computed<Folder | null>(() => {
    if (editingFolderId.value === null) return null
    return folders.value.find((folder) => folder.id === editingFolderId.value) || null
  })

  // 方法
  async function loadFolders(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      folders.value = await window.api.folder.getAll()
      if (folders.value.length === 0) {
        selectedFolderId.value = null
      } else {
        selectedFolderId.value = folders.value[0].id
      }
    } catch (err) {
      console.error('加载文件夹失败:', err)
      error.value = '加载文件夹失败'
    } finally {
      isLoading.value = false
    }
  }

  async function createFolder(
    name: string,
    parentId: number | null = null,
    description: string = ''
  ): Promise<FolderOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.folder.create(name, parentId, description)
      if (result.changes > 0) {
        await loadFolders()
      }
      return result
    } catch (err) {
      console.error('创建文件夹失败:', err)
      error.value = '创建文件夹失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateFolder(
    id: number,
    name: string,
    description: string
  ): Promise<FolderOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.folder.update(id, name, description)
      if (result.changes > 0) {
        await loadFolders()
      }
      return result
    } catch (err) {
      console.error('更新文件夹失败:', err)
      error.value = '更新文件夹失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteFolder(id: number): Promise<FolderOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.folder.delete(id)
      if (result.changes > 0) {
        await loadFolders()
      }
      return result
    } catch (err) {
      console.error('删除文件夹失败:', err)
      error.value = '删除文件夹失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setSelectedFolder(id: number | null): void {
    console.log('Setting selected folder:', id)
    console.log('Current selectedFolderId:', selectedFolderId.value)
    selectedFolderId.value = id
    console.log('New selectedFolderId:', selectedFolderId.value)
  }

  function setEditingFolder(id: number | null): void {
    editingFolderId.value = id
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // 状态
    folders,
    selectedFolderId,
    editingFolderId,
    isLoading,
    error,
    // 计算属性
    folderTree,
    selectedFolder,
    editingFolder,
    // 方法
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    setSelectedFolder,
    setEditingFolder,
    clearError
  }
})
