import { ElectronAPI } from '@electron-toolkit/preload'

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
    }
  }
}
