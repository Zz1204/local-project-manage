export interface Folder {
  id: number
  name: string
  path: string
  parent_id: number | null
  description: string
  created_at: string
  updated_at: string
}

export interface FolderOperationResult {
  changes: number
  lastInsertRowid: number
}

export interface FolderTreeItem extends Folder {
  children: FolderTreeItem[]
  key: number
  label: string
}

export interface FolderState {
  folders: Folder[]
  selectedFolderId: number | null
  editingFolderId: number | null
  isLoading: boolean
  error: string | null
}
