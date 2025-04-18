import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectOperationResult } from '../types/project'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const selectedProjectId = ref<number | null>(null)
  const editingProjectId = ref<number | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    currentPage: 1,
    pageSize: 10,
    total: 0
  })

  // 计算属性
  const selectedProject = computed<Project | null>(() => {
    if (selectedProjectId.value === null) return null
    return projects.value.find((p) => p.id === selectedProjectId.value) || null
  })

  const editingProject = computed<Project | null>(() => {
    if (editingProjectId.value === null) return null
    const project = projects.value.find((p) => p.id === editingProjectId.value) || null
    console.log('编辑中的项目:', project)
    console.log('编辑中的项目路径:', project?.path)
    return project
  })

  // 方法
  async function loadProjects(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.project.getAll(
        pagination.value.currentPage,
        pagination.value.pageSize
      )
      console.log('加载的项目数据:', result.projects)
      projects.value = result.projects
      pagination.value.total = result.total
    } catch (err) {
      console.error('加载项目失败:', err)
      error.value = '加载项目失败'
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProjectOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.project.create(project)
      if (result.success) {
        await loadProjects()
      }
      return result
    } catch (err) {
      console.error('创建项目失败:', err)
      error.value = '创建项目失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(
    id: number,
    project: Partial<Project>
  ): Promise<ProjectOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.project.update(id, project)
      if (result.success) {
        await loadProjects()
      }
      return result
    } catch (err) {
      console.error('更新项目失败:', err)
      error.value = '更新项目失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProject(id: number): Promise<ProjectOperationResult> {
    isLoading.value = true
    error.value = null
    try {
      const result = await window.api.project.delete(id)
      if (result.success) {
        await loadProjects()
      }
      return result
    } catch (err) {
      console.error('删除项目失败:', err)
      error.value = '删除项目失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setSelectedProject(id: number | null): void {
    selectedProjectId.value = id
  }

  function setEditingProject(id: number | null): void {
    console.log('设置编辑项目ID:', id)
    editingProjectId.value = id
  }

  function setPagination(page: number, pageSize: number): void {
    pagination.value.currentPage = page
    pagination.value.pageSize = pageSize
  }

  function clearError(): void {
    error.value = null
  }

  return {
    // 状态
    projects,
    selectedProjectId,
    editingProjectId,
    isLoading,
    error,
    pagination,
    // 计算属性
    selectedProject,
    editingProject,
    // 方法
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    setSelectedProject,
    setEditingProject,
    setPagination,
    clearError
  }
})
