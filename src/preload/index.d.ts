import { ElectronAPI } from '@electron-toolkit/preload'
import { Folder, FolderOperationResult } from '../renderer/src/types/folder'
import { Editor, EditorOperationResult } from '../renderer/src/types/editor'
import { Project, ProjectOperationResult } from '../renderer/src/types/project'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      setNativeTheme: (isDark: boolean) => void
      getSystemLanguage: () => Promise<string>
      dialog: {
        showOpenDialog: (
          options: Electron.OpenDialogOptions
        ) => Promise<Electron.OpenDialogReturnValue>
      }
      window: {
        openRouteInNewWindow: (
          route: string,
          options?: Electron.BrowserWindowConstructorOptions
        ) => Promise<boolean>
        closeWindow: (name: string) => Promise<boolean>
        getAllWindowNames: () => Promise<string[]>
        minimize: () => void
        toggleMaximize: () => void
        close: () => void
        openOrFocusRouteInWindow: (
          route: string,
          name: string,
          options?: Electron.BrowserWindowConstructorOptions
        ) => Promise<boolean>
        openOrFocusWindow: (
          name: string,
          options?: Electron.BrowserWindowConstructorOptions
        ) => Promise<boolean>
      }
      pinia: {
        syncState: (storeName: string, stateChange: Record<string, unknown>) => void
        onStateChange: (
          callback: (data: { storeName: string; stateChange: Record<string, unknown> }) => void
        ) => () => void
      }
      folder: {
        create: (
          name: string,
          parentId: number | null,
          description: string
        ) => Promise<FolderOperationResult>
        getAll: () => Promise<Folder[]>
        getChildren: (parentId: number | null) => Promise<Folder[]>
        update: (id: number, name: string, description: string) => Promise<FolderOperationResult>
        delete: (id: number) => Promise<FolderOperationResult>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string) => Promise<any>
      }
      editor: {
        create: (
          editor: Omit<Editor, 'id' | 'createdAt' | 'updatedAt'>
        ) => Promise<EditorOperationResult>
        getAll: () => Promise<Editor[]>
        update: (id: number, editor: Partial<Editor>) => Promise<EditorOperationResult>
        delete: (id: number) => Promise<EditorOperationResult>
        setDefault: (id: number) => Promise<EditorOperationResult>
        openProject: (
          editorId: number,
          projectPath: string,
          projectId: number
        ) => Promise<{ success: boolean }>
        scan: () => Promise<{ success: boolean; editors: Editor[] }>
      }
      project: {
        create: (
          project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
        ) => Promise<ProjectOperationResult>
        getAll: (page: number, pageSize: number) => Promise<{ projects: Project[]; total: number }>
        update: (id: number, project: Partial<Project>) => Promise<ProjectOperationResult>
        delete: (id: number) => Promise<ProjectOperationResult>
      }
      shell: {
        openPath: (path: string) => Promise<string>
      }
      detectVersionControl: (folderPath: string) => Promise<{
        tool: 'git' | 'svn' | 'hg' | 'none'
        branch: string | null
        success: boolean
        error?: string
      } | null>
    }
  }
}
