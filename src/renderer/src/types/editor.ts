export interface Editor {
  id: number
  displayName: string
  executablePath: string
  commandArgs: string
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface EditorOperationResult {
  success: boolean
  message?: string
  editor?: Editor
}
