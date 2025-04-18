import { ElectronAPI } from '@electron-toolkit/preload'
import { Folder, FolderOperationResult } from '../renderer/src/types/folder'
import { Editor, EditorOperationResult } from '../renderer/src/types/editor'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      setNativeTheme: (isDark: boolean) => void
      getSystemLanguage: () => Promise<string>
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
          displayName: string,
          executablePath: string,
          commandArgs: string,
          isDefault: boolean
        ) => Promise<EditorOperationResult>
        getAll: () => Promise<Editor[]>
        update: (
          id: number,
          displayName: string,
          executablePath: string,
          commandArgs: string,
          isDefault: boolean
        ) => Promise<EditorOperationResult>
        delete: (id: number) => Promise<EditorOperationResult>
        setDefault: (id: number) => Promise<EditorOperationResult>
        scan: () => Promise<{ success: boolean; editors: Editor[] }>
      }
    }
  }
}
