import { ElectronAPI } from '@electron-toolkit/preload'
import { Folder, FolderOperationResult } from '../renderer/src/types/folder'

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
    }
  }
}
