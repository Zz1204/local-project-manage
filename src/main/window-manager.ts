import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import log from './logger'

// 窗口管理
interface WindowOptions extends BrowserWindowConstructorOptions {
  url?: string
  hash?: string
  name?: string
  title?: string
}

// 存储所有创建的窗口
const windows = new Map<string, BrowserWindow>()

/**
 * 创建一个新窗口
 * @param options 窗口选项
 * @returns 创建的BrowserWindow实例
 */
function createWindow(options: WindowOptions): BrowserWindow {
  const {
    url,
    hash,
    name = `window-${Date.now()}`,
    width = 900,
    height = 670,
    minWidth = 900,
    minHeight = 670,
    webPreferences,
    title,
    ...restOptions
  } = options

  // 创建浏览器窗口
  const window = new BrowserWindow({
    width,
    height,
    minWidth,
    minHeight,
    show: false,
    autoHideMenuBar: true,
    movable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      ...webPreferences
    },
    title,
    ...restOptions
  })

  // 显式设置窗口标题（双重保险）
  if (title) {
    window.setTitle(title)

    // 监听页面加载完成事件，再次设置标题以防被页面覆盖
    window.webContents.on('did-finish-load', () => {
      window.setTitle(title)
    })
  }

  // 窗口准备好时显示
  window.on('ready-to-show', () => {
    window.show()
  })

  // 加载页面
  if (url) {
    window.loadURL(url)
  } else if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    // 开发环境
    const devUrl = process.env['ELECTRON_RENDERER_URL'] + (hash ? `#${hash}` : '')
    window.loadURL(devUrl)
  } else {
    // 生产环境
    const prodPath = join(__dirname, '../renderer/index.html')
    window.loadFile(prodPath, { hash })
  }

  // 存储窗口引用
  windows.set(name, window)

  // 窗口关闭时，从Map中删除
  window.on('closed', () => {
    windows.delete(name)
  })

  return window
}

/**
 * 获取窗口实例
 * @param name 窗口名称
 * @returns 窗口实例，不存在则返回undefined
 */
function getWindow(name: string): BrowserWindow | undefined {
  return windows.get(name)
}

/**
 * 关闭指定窗口
 * @param name 窗口名称
 * @returns 是否成功关闭
 */
function closeWindow(name: string): boolean {
  const window = windows.get(name)
  if (window && !window.isDestroyed()) {
    window.close()
    return true
  }
  return false
}

/**
 * 获取所有窗口
 * @returns 所有窗口的Map
 */
function getAllWindows(): Map<string, BrowserWindow> {
  return windows
}

/**
 * 创建一个显示特定路由的窗口
 * @param routePath 路由路径
 * @param options 窗口选项
 * @returns 创建的窗口实例
 */
function createWindowForRoute(routePath: string, options: WindowOptions = {}): BrowserWindow {
  // 确保路由路径不以#开头
  const hash = routePath.startsWith('#') ? routePath.substring(1) : routePath

  // 特殊处理小窗口，确保尺寸不变
  const finalOptions = { ...options }

  // 确保title被保留
  if (options.title) {
    log.info(`创建窗口，标题: ${options.title}`)
  }

  // 如果是小窗口（宽度小于500）且没有显式设置resizable
  if (options.width && options.width < 500 && options.resizable !== true) {
    // 默认设置为不可调整大小
    finalOptions.resizable = false

    // 确保可以移动
    finalOptions.movable = true

    // 设置最大尺寸等于指定尺寸，防止意外调整
    if (options.width) {
      finalOptions.maxWidth = options.width
    }

    if (options.height) {
      finalOptions.maxHeight = options.height
    }
  }

  return createWindow({ ...finalOptions, hash })
}

/**
 * 关闭所有窗口
 */
function closeAllWindows(): void {
  windows.forEach((window) => {
    window.close()
  })
}

/**
 * 打开或聚焦窗口
 * @param name 窗口名称
 * @param options 窗口选项
 * @returns 窗口实例
 */
function openOrFocusWindow(name: string, options: WindowOptions = {}): BrowserWindow {
  // 检查窗口是否已存在
  const existingWindow = windows.get(name)

  if (existingWindow && !existingWindow.isDestroyed()) {
    // 窗口已存在，聚焦到该窗口
    if (existingWindow.isMinimized()) {
      existingWindow.restore()
    }
    existingWindow.focus()
    return existingWindow
  }

  // 窗口不存在，创建新窗口
  return createWindow({ ...options, name })
}

/**
 * 打开或聚焦特定路由的窗口
 * @param routePath 路由路径
 * @param name 窗口名称
 * @param options 窗口选项
 * @returns 窗口实例
 */
function openOrFocusWindowForRoute(
  routePath: string,
  name: string,
  options: WindowOptions = {}
): BrowserWindow {
  // 检查窗口是否已存在
  const existingWindow = windows.get(name)

  if (existingWindow && !existingWindow.isDestroyed()) {
    // 窗口已存在，聚焦到该窗口
    if (existingWindow.isMinimized()) {
      existingWindow.restore()
    }
    existingWindow.focus()
    return existingWindow
  }

  // 窗口不存在，创建新窗口
  return createWindowForRoute(routePath, { ...options, name })
}

export {
  createWindow,
  getWindow,
  closeWindow,
  getAllWindows,
  createWindowForRoute,
  closeAllWindows,
  openOrFocusWindow,
  openOrFocusWindowForRoute,
  type WindowOptions
}
