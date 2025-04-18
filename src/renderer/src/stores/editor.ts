import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Editor } from '../types/editor'

export const useEditorStore = defineStore('editor', () => {
  const editors = ref<Editor[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 获取所有编辑器
  async function fetchEditors() {
    try {
      isLoading.value = true
      error.value = null
      editors.value = await window.api.editor.getAll()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取编辑器列表失败'
      console.error('获取编辑器列表失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 创建编辑器
  async function createEditor(editor: Omit<Editor, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      isLoading.value = true
      error.value = null
      const result = await window.api.editor.create(editor)
      console.log('createEditor', result)
      if (result.success) {
        await fetchEditors()
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建编辑器失败'
      console.error('创建编辑器失败:', err)
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 更新编辑器
  async function updateEditor(editor: Editor) {
    try {
      isLoading.value = true
      error.value = null
      const result = await window.api.editor.update(editor.id, editor)
      if (result.success) {
        await fetchEditors()
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新编辑器失败'
      console.error('更新编辑器失败:', err)
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 删除编辑器
  async function deleteEditor(id: number) {
    try {
      isLoading.value = true
      error.value = null
      const result = await window.api.editor.delete(id)
      if (result.success) {
        await fetchEditors()
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除编辑器失败'
      console.error('删除编辑器失败:', err)
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // 扫描本地编辑器
  async function scanLocalEditors() {
    try {
      isLoading.value = true
      error.value = null
      const result = await window.api.editor.scan()
      if (result.success) {
        await fetchEditors()
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '扫描本地编辑器失败'
      console.error('扫描本地编辑器失败:', err)
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    editors,
    isLoading,
    error,
    fetchEditors,
    createEditor,
    updateEditor,
    deleteEditor,
    scanLocalEditors
  }
})
