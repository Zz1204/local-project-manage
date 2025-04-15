import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 设置原生窗口暗黑模式
  setNativeTheme: (isDark: boolean) => {
    ipcRenderer.send('set-native-theme', isDark)
  },
  // 获取系统语言
  getSystemLanguage: () => {
    return ipcRenderer.invoke('get-system-language')
  },
  // 窗口管理相关API
  window: {
    // 创建新窗口并打开指定路由
    openRouteInNewWindow: (route: string, options?: Electron.BrowserWindowConstructorOptions) => {
      return ipcRenderer.invoke('window:open-route', route, options)
    },
    // 关闭指定窗口
    closeWindow: (name: string) => {
      return ipcRenderer.invoke('window:close', name)
    },
    // 获取所有窗口名称
    getAllWindowNames: () => {
      return ipcRenderer.invoke('window:get-all-names')
    },
    // 最小化当前窗口
    minimize: () => {
      ipcRenderer.send('window:minimize')
    },
    // 最大化/还原当前窗口
    toggleMaximize: () => {
      ipcRenderer.send('window:toggle-maximize')
    },
    // 关闭当前窗口
    close: () => {
      ipcRenderer.send('window:close-current')
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
