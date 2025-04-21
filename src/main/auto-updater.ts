import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from './logger'
import path from 'node:path'

const isDev = process.env.NODE_ENV === 'development'
// 配置日志
autoUpdater.logger = log
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// 更新状态
let updateAvailable = false
let updateDownloaded = false
let updateInfo: any = null
let mainWindow: BrowserWindow | null = null

// 初始化自动更新
export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window

  if (isDev) {
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
    autoUpdater.forceDevUpdateConfig = true
  }

  // 检查更新
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...')
    sendStatusToWindow('checking-for-update')
  })

  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info)
    updateAvailable = true
    updateInfo = info
    sendStatusToWindow('update-available', info)
  })

  // 没有新版本
  autoUpdater.on('update-not-available', (info) => {
    log.info('当前已是最新版本:', info)
    sendStatusToWindow('update-not-available', info)
  })

  // 更新错误
  autoUpdater.on('error', (err) => {
    log.error('更新出错:', err)
    sendStatusToWindow('error', err.toString())
  })

  // 更新下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    log.info('下载进度:', progressObj)
    sendStatusToWindow('download-progress', progressObj)
  })

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    log.info('更新已下载:', info)
    updateDownloaded = true
    sendStatusToWindow('update-downloaded', info)
  })

  // 注册IPC处理程序
  ipcMain.handle('updater:check-for-updates', async () => {
    try {
      log.info('手动检查更新')
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('检查更新失败:', error)
      throw error
    }
  })

  ipcMain.handle('updater:download-update', async () => {
    try {
      if (updateAvailable && !updateDownloaded) {
        log.info('开始下载更新')
        return await autoUpdater.downloadUpdate()
      } else {
        return { success: false, message: '没有可用更新或更新已下载' }
      }
    } catch (error) {
      log.error('下载更新失败:', error)
      throw error
    }
  })

  ipcMain.handle('updater:quit-and-install', () => {
    if (updateDownloaded) {
      log.info('退出并安装更新')
      autoUpdater.quitAndInstall(false, true)
      return { success: true }
    } else {
      return { success: false, message: '更新尚未下载完成' }
    }
  })

  ipcMain.handle('updater:get-status', () => {
    return {
      updateAvailable,
      updateDownloaded,
      updateInfo
    }
  })

  // 应用启动后检查更新
  app.whenReady().then(() => {
    // 延迟几秒检查更新，避免影响应用启动速度
    setTimeout(() => {
      log.info('应用启动后自动检查更新')
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('自动检查更新失败:', err)
      })
    }, 10000) // 延迟10秒
  })
}

// 向渲染进程发送更新状态
function sendStatusToWindow(status: string, data?: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { status, data })
  }
}

// 手动检查更新
export function checkForUpdates(): Promise<any> {
  return autoUpdater.checkForUpdates()
}

// 获取当前应用版本
export function getAppVersion(): string {
  return app.getVersion()
}
