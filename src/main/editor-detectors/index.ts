import { checkWindows } from './windows'
import { checkMacOS } from './macos'
import { checkLinux } from './linux'
import { manualPickEditor } from './utils'
import { editorConfigs } from './config'

// 跨平台编辑器检测
export async function detectEditors() {
  const platform = process.platform
  let results = []

  // 平台特定检测
  if (platform === 'win32') {
    const winEditors = await checkWindows()
    results.push(...winEditors)
  } else if (platform === 'darwin') {
    const macEditors = await checkMacOS()
    results.push(...macEditors)
  } else if (platform === 'linux') {
    const linuxEditors = await checkLinux()
    results.push(...linuxEditors)
  }

  // 去重处理
  return Array.from(new Set(results.map((e) => e.path))).map((p) =>
    results.find((e) => e.path === p)
  )
}

// 导出所有检测器函数和配置
export { checkWindows, checkMacOS, checkLinux, manualPickEditor, editorConfigs }
