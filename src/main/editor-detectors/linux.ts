import path from 'path'
import log from '../logger'
import { checkFileExists, readDesktopFile } from './utils'
import { editorConfigs } from './config'

// Linux检测
export async function checkLinux(): Promise<Array<{ name: string; path: string }>> {
  const editors = []

  // 遍历所有编辑器配置
  for (const editor of editorConfigs) {
    // 检查是否有 Linux 配置
    if (!editor.linux) continue

    // 检查桌面文件
    if (editor.linux.desktopFiles) {
      for (const desktopFile of editor.linux.desktopFiles) {
        const execPath = await readDesktopFile(desktopFile)
        if (execPath && (await checkFileExists(execPath))) {
          editors.push({
            name: editor.name,
            path: execPath
          })
          break // 找到一个有效的桌面文件就跳出循环
        }
      }
    }

    // 检查默认路径
    if (editor.linux.defaultPaths) {
      for (const defaultPath of editor.linux.defaultPaths) {
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
