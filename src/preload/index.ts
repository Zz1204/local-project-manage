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
  // 对话框相关API
  dialog: {
    showOpenDialog: (options: Electron.OpenDialogOptions) => {
      return ipcRenderer.invoke('dialog:showOpenDialog', options)
    }
  },
  // 窗口管理相关API
  window: {
    // 创建新窗口并打开指定路由
    openRouteInNewWindow: (route: string, options?: Electron.BrowserWindowConstructorOptions) => {
      return ipcRenderer.invoke('window:open-route', route, options)
    },
    // 打开或聚焦窗口并加载指定路由
    openOrFocusRouteInWindow: (
      route: string,
      name: string,
      options?: Electron.BrowserWindowConstructorOptions
    ) => {
      return ipcRenderer.invoke('window:open-or-focus-route', route, name, options)
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
  },
  // Pinia状态同步相关API
  pinia: {
    // 发送Pinia状态变更到主进程
    syncState: (storeName: string, stateChange: Record<string, unknown>) => {
      ipcRenderer.send('pinia:sync-state', { storeName, stateChange })
    },
    // 注册回调以接收来自主进程的Pinia状态变更
    onStateChange: (
      callback: (data: { storeName: string; stateChange: Record<string, unknown> }) => void
    ): (() => void) => {
      const listener = (
        _: Electron.IpcRendererEvent,
        data: { storeName: string; stateChange: Record<string, unknown> }
      ): void => {
        callback(data)
      }
      ipcRenderer.on('pinia:state-changed', listener)
      // 返回取消监听的函数
      return (): void => {
        ipcRenderer.removeListener('pinia:state-changed', listener)
      }
    }
  },
  // 文件夹相关的 IPC 通信接口
  folder: {
    create: (name: string, parentId: number | null, description: string) =>
      ipcRenderer.invoke('folder:create', name, parentId, description),
    getAll: () => ipcRenderer.invoke('folder:getAll'),
    getChildren: (parentId: number | null) => ipcRenderer.invoke('folder:getChildren', parentId),
    update: (id: number, name: string, description: string) =>
      ipcRenderer.invoke('folder:update', id, name, description),
    delete: (id: number) => ipcRenderer.invoke('folder:delete', id)
  },
  // 设置相关的 IPC 通信接口
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value)
  },
  // 编辑器相关的 IPC 通信接口
  editor: {
    create: (editor) => ipcRenderer.invoke('editor:create', editor),
    getAll: () => ipcRenderer.invoke('editor:getAll'),
    update: (id, editor) => ipcRenderer.invoke('editor:update', id, editor),
    delete: (id) => ipcRenderer.invoke('editor:delete', id),
    setDefault: (id) => ipcRenderer.invoke('editor:setDefault', id),
    openProject: (editorId, projectPath, projectId) =>
      ipcRenderer.invoke('editor:openProject', editorId, projectPath),
    scan: () => ipcRenderer.invoke('editor:scan')
  },
  project: {
    create: (project) => ipcRenderer.invoke('project:create', project),
    getAll: (page, pageSize, folderId) =>
      ipcRenderer.invoke('project:getAll', page, pageSize, folderId),
    update: (id, project) => ipcRenderer.invoke('project:update', id, project),
    delete: (id) => ipcRenderer.invoke('project:delete', id),
    getGitStatus: (projectPath: string) => ipcRenderer.invoke('project:getGitStatus', projectPath),
    detectType: (projectPath: string) => ipcRenderer.invoke('project:detectType', projectPath)
  },
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path)
  },
  detectVersionControl: (folderPath: string) =>
    ipcRenderer.invoke('detect-version-control', folderPath),
  // 自动更新相关API
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    getStatus: () => ipcRenderer.invoke('updater:get-status'),
    onStatus: (callback) => {
      const listener = (_, data) => callback(data)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    }
  },
  // 应用版本相关API
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version')
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
