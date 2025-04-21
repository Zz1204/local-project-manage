export interface GitStatus {
  branch: string
  isClean: boolean
  ahead: number
  behind: number
  modified: number
  staged: number
  untracked: number
  lastCommit: {
    hash: string
    message: string
    date: string
  }
}

export type ProjectType =
  | 'web'
  | 'java'
  | 'python'
  | 'go'
  | 'node'
  | 'rust'
  | 'dotnet'
  | 'php'
  | 'unknown'

export interface ProjectTypeInfo {
  type: ProjectType
  framework?: string // 框架信息，如 React、Vue、Spring 等
  language?: string // 主要编程语言
  packageManager?: string // 包管理器，如 npm、maven、pip 等
}

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
  gitStatus?: GitStatus | null
  projectType?: ProjectTypeInfo
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
