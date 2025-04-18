import path from 'path'
import log from '../logger'
import { queryWindowsRegistry, checkFileExists } from './utils'
import { editorConfigs } from './config'

// Windows检测
export async function checkWindows(): Promise<Array<{ name: string; path: string }>> {
  const editors = []

  // 遍历所有编辑器配置
  for (const editor of editorConfigs) {
    // 检查是否有 Windows 配置
    if (!editor.windows) continue

    // 检查注册表
    if (editor.windows.registryKeys) {
      for (const registryKey of editor.windows.registryKeys) {
        const installPath = await queryWindowsRegistry(registryKey.key, registryKey.valueName)

        if (installPath) {
          const executablePath = path.join(installPath, registryKey.executablePath)
          if (await checkFileExists(executablePath)) {
            editors.push({
              name: editor.name,
              path: executablePath
            })
            break // 找到一个有效的安装路径就跳出循环
          }
        }
      }
    }

    // 检查默认路径
    if (editor.windows.defaultPaths) {
      for (const defaultPath of editor.windows.defaultPaths) {
        if (await checkFileExists(defaultPath)) {
          editors.push({
            name: editor.name,
            path: defaultPath
          })
          break // 找到一个有效的默认路径就跳出循环
        }
      }
    }
  }

  return editors
}
