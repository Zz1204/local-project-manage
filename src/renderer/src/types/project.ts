export interface Project {
  id: number
  name: string
  description: string
  editorId: number | null
  folderId: number | null
  folderPath: string | null
  versionControlTool: string
  branch: string
  branchName: string | null
  isFavorite: boolean
  lastOpenTime: number | null
  path: string
  createdAt: string
  updatedAt: string
}

export interface ProjectOperationResult {
  success: boolean
  message?: string
  project?: Project
}

export interface ProjectState {
  projects: Project[]
  selectedProjectId: number | null
  editingProjectId: number | null
  isLoading: boolean
  error: string | null
  pagination: {
    currentPage: number
    pageSize: number
    total: number
  }
}
