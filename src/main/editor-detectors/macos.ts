import path from 'path'
import log from '../logger'
import { checkFileExists, executeMdfind } from './utils'
import { editorConfigs } from './config'

// macOS检测
export async function checkMacOS(): Promise<Array<{ name: string; path: string }>> {
  const editors = []

  // 遍历所有编辑器配置
  for (const editor of editorConfigs) {
    // 检查是否有 macOS 配置
    if (!editor.macos) continue

    // 检查 bundleIds
    if (editor.macos.bundleIds && editor.macos.bundleIds.length > 0) {
      const bundleIdsQuery = editor.macos.bundleIds
        .map((id) => `kMDItemCFBundleIdentifier == '${id}'`)
        .join(' || ')

      const query = `kMDItemContentType == 'com.apple.application-bundle' && (${bundleIdsQuery})`
      const results = await executeMdfind(query)

      for (const result of results) {
        if (await checkFileExists(result)) {
          editors.push({
            name: editor.name,
            path: result
          })
          break // 找到一个有效的结果就跳出循环
        }
      }
    }

    // 检查默认路径
    if (editor.macos.defaultPaths) {
      for (const defaultPath of editor.macos.defaultPaths) {
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
