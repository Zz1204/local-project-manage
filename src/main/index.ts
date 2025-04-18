import { app, shell, BrowserWindow, ipcMain, nativeTheme, dialog } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { exec } from 'child_process'
import {
  createWindow,
  createWindowForRoute,
  closeWindow,
  closeAllWindows,
  getAllWindows,
  openOrFocusWindow,
  openOrFocusWindowForRoute,
  type WindowOptions
} from './window-manager'
import { folderOperations, settingsOperations, editorOperations } from './database'
import { scanEditorsService } from './editor-service'

// 第一步：在所有其他导入前设置控制台编码
if (process.platform === 'win32') {
  // 方法1：使用转义序列设置UTF-8模式
  process.stdout.write('\x1b%G')

  // 方法2：作为应用初始化的一部分设置代码页
  app.whenReady().then(() => {
    exec('chcp 65001', (error) => {
      if (error) {
        console.error('设置控制台代码页失败:', error)
      }
    })
  })
}

// 导入日志模块（导入后就会开始记录日志）
import log from './logger'

// 应用启动日志
log.info('应用启动')

function createMainWindow(): void {
  // 使用窗口管理器创建主窗口
  const mainWindow = createWindow({
    name: 'main', // 设置窗口名称为main
    width: 1000,
    height: 670,
    minWidth: 1000,
    minHeight: 670,
    webPreferences: {
      sandbox: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    closeAllWindows()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 处理原生窗口暗黑模式
  ipcMain.on('set-native-theme', (_, isDark: boolean) => {
    nativeTheme.themeSource = isDark ? 'dark' : 'light'
  })

  // 处理获取系统语言
  ipcMain.handle('get-system-language', () => {
    return app.getLocale()
  })

  // 处理文件选择对话框
  ipcMain.handle('dialog:showOpenDialog', async (_, options) => {
    try {
      return await dialog.showOpenDialog(options)
    } catch (error) {
      log.error('显示文件选择对话框失败:', error)
      throw error
    }
  })

  // 设置相关的 IPC 处理
  ipcMain.handle('settings:get', (_, key: string) => {
    try {
      return settingsOperations.getSetting(key)
    } catch (error) {
      log.error('获取设置失败:', error)
      throw error
    }
  })

  ipcMain.handle('settings:set', (_, key: string, value: string) => {
    try {
      return settingsOperations.setSetting(key, value)
    } catch (error) {
      log.error('设置失败:', error)
      throw error
    }
  })

  // 窗口管理相关IPC处理
  // 打开新窗口并加载指定路由
  ipcMain.handle('window:open-route', (_, route: string, options = {}) => {
    try {
      // 记录传入的窗口选项，帮助调试
      log.info('打开新窗口:', route)
      log.info('窗口选项:', JSON.stringify(options, null, 2))

      // 确保options的类型与WindowOptions兼容
      const windowOptions = options as WindowOptions
      createWindowForRoute(route, windowOptions)
      return true
    } catch (error) {
      log.error('打开窗口失败:', error)
      return false
    }
  })

  // 打开或聚焦窗口并加载指定路由
  ipcMain.handle('window:open-or-focus-route', (_, route: string, name: string, options = {}) => {
    try {
      // 记录传入的窗口选项，帮助调试
      log.info('打开或聚焦窗口:', route, name)
      log.info('窗口选项:', JSON.stringify(options, null, 2))

      // 确保options的类型与WindowOptions兼容
      const windowOptions = options as WindowOptions
      openOrFocusWindowForRoute(route, name, windowOptions)
      return true
    } catch (error) {
      log.error('打开或聚焦窗口失败:', error)
      return false
    }
  })

  // 打开或聚焦窗口
  ipcMain.handle('window:open-or-focus', (_, name: string, options = {}) => {
    try {
      const windowOptions = options as WindowOptions
      openOrFocusWindow(name, windowOptions)
      return true
    } catch (error) {
      log.error('打开或聚焦窗口失败:', error)
      return false
    }
  })

  // 关闭指定窗口
  ipcMain.handle('window:close', (_, name: string) => {
    return closeWindow(name)
  })

  // 获取所有窗口名称
  ipcMain.handle('window:get-all-names', () => {
    return Array.from(getAllWindows().keys())
  })

  // 窗口控制 - 最小化当前窗口
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      win.minimize()
    }
  })

  // 窗口控制 - 最大化/还原当前窗口
  ipcMain.on('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  // 窗口控制 - 关闭当前窗口
  ipcMain.on('window:close-current', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && !win.isDestroyed()) {
      win.close()
    }
  })

  // Pinia状态同步 - 接收状态变更并广播给其他窗口
  ipcMain.on('pinia:sync-state', (event, data) => {
    // 记录状态同步信息
    log.info('收到Pinia状态同步:', data.storeName)

    // 获取发送者窗口ID，用于排除发送者（避免循环同步）
    const senderId = event.sender.id

    // 获取所有窗口并广播状态变更
    for (const [, window] of getAllWindows()) {
      // 跳过发送者窗口
      if (window.webContents.id !== senderId && !window.isDestroyed()) {
        window.webContents.send('pinia:state-changed', data)
      }
    }
  })

  // 文件夹相关的 IPC 处理
  ipcMain.handle(
    'folder:create',
    (_, name: string, parentId: number | null, description: string) => {
      try {
        return folderOperations.createFolder(name, parentId, description)
      } catch (error) {
        log.error('创建文件夹失败:', error)
        throw error
      }
    }
  )

  ipcMain.handle('folder:getAll', () => {
    try {
      return folderOperations.getAllFolders()
    } catch (error) {
      log.error('获取文件夹列表失败:', error)
      throw error
    }
  })

  ipcMain.handle('folder:getChildren', (_, parentId: number | null) => {
    try {
      return folderOperations.getChildFolders(parentId)
    } catch (error) {
      log.error('获取子文件夹失败:', error)
      throw error
    }
  })

  ipcMain.handle('folder:update', (_, id: number, name: string, description: string) => {
    try {
      return folderOperations.updateFolder(id, name, description)
    } catch (error) {
      log.error('更新文件夹失败:', error)
      throw error
    }
  })

  ipcMain.handle('folder:delete', (_, id: number) => {
    try {
      return folderOperations.deleteFolder(id)
    } catch (error) {
      log.error('删除文件夹失败:', error)
      throw error
    }
  })

  // 编辑器相关的 IPC 处理
  ipcMain.handle(
    'editor:create',
    (_, displayName: string, executablePath: string, commandArgs: string, isDefault: boolean) => {
      try {
        return editorOperations.createEditor(displayName, executablePath, commandArgs, isDefault)
      } catch (error) {
        log.error('创建编辑器失败:', error)
        throw error
      }
    }
  )

  ipcMain.handle('editor:getAll', () => {
    try {
      return editorOperations.getAllEditors()
    } catch (error) {
      log.error('获取编辑器列表失败:', error)
      throw error
    }
  })

  ipcMain.handle(
    'editor:update',
    (
      _,
      id: number,
      displayName: string,
      executablePath: string,
      commandArgs: string,
      isDefault: boolean
    ) => {
      try {
        return editorOperations.updateEditor(
          id,
          displayName,
          executablePath,
          commandArgs,
          isDefault
        )
      } catch (error) {
        log.error('更新编辑器失败:', error)
        throw error
      }
    }
  )

  ipcMain.handle('editor:delete', (_, id: number) => {
    try {
      return editorOperations.deleteEditor(id)
    } catch (error) {
      log.error('删除编辑器失败:', error)
      throw error
    }
  })

  ipcMain.handle('editor:setDefault', (_, id: number) => {
    try {
      return editorOperations.setDefaultEditor(id)
    } catch (error) {
      log.error('设置默认编辑器失败:', error)
      throw error
    }
  })

  ipcMain.handle('editor:scan', async () => {
    try {
      const result = await scanEditorsService()
      // 扫描到编辑器后将他们存入数据库
      if (result.success && result.editors.length > 0) {
        for (const editor of result.editors) {
          try {
            // 检查编辑器是否已存在
            const existingEditor = editorOperations
              .getAllEditors()
              .find((e: any) => e.displayName === editor.displayName)

            if (!existingEditor) {
              // 如果不存在，则创建新的编辑器记录
              editorOperations.createEditor(
                editor.displayName,
                editor.executablePath,
                editor.commandArgs,
                editor.isDefault
              )
              log.info(`添加新编辑器: ${editor.displayName}`)
            } else {
              log.info(`编辑器已存在: ${editor.displayName}，跳过添加`)
            }
          } catch (err) {
            log.error(`保存编辑器 ${editor.displayName} 失败:`, err)
          }
        }
      } else {
        log.info('未扫描到编辑器或扫描失败')
      }
      return result
    } catch (error) {
      log.error('扫描本地编辑器失败:', error)
      throw error
    }
  })

  createMainWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
