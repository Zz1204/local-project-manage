import { dialog } from 'electron'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'
const execAsync = util.promisify(exec)
const fs = require('fs').promises

// Windows注册表查询（替代regedit）
export async function queryWindowsRegistry(key: string, valueName: string): Promise<string | null> {
  try {
    const res = await execAsync(`reg query "${key}" /v ${valueName} `, { windowsHide: true })
    const match = res.stdout.match(/REG_SZ\s+(.+)/i)
    return match ? path.normalize(match[1].trim()) : null
  } catch (e) {
    return null
  }
}

// 手动选择
export async function manualPickEditor(): Promise<{ name: string; path: string } | null> {
  const filters = {
    win32: [{ name: 'Executable', extensions: ['exe'] }],
    darwin: [{ name: 'Application', extensions: ['app'] }],
    linux: [{ name: 'Executable', extensions: [''] }]
  }[process.platform]

  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters
  })
  return canceled ? null : { name: 'Custom Editor', path: filePaths[0] }
}

// 检查文件是否存在
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// 读取桌面文件
export async function readDesktopFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    const execLine = content.split('\n').find((l) => l.startsWith('Exec='))
    if (execLine) {
      return execLine.split('=')[1].split(' ')[0].trim()
    }
    return null
  } catch {
    return null
  }
}

// 执行 mdfind 命令
export async function executeMdfind(query: string): Promise<string[]> {
  try {
    const { stdout } = await execAsync(`mdfind "${query}"`)
    return stdout.split('\n').filter(Boolean)
  } catch {
    return []
  }
}
