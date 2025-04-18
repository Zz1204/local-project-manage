import log from './logger'
import { Editor } from '../renderer/src/types/editor'
import { detectEditors } from './editor-detectors'

// 主流程
export async function scanEditorsService(): Promise<{ success: boolean; editors: Editor[] }> {
  try {
    const detectedEditors = await detectEditors()
    const editors = detectedEditors.map((editor) => ({
      id: Math.floor(Math.random() * 1000000), // 临时ID，实际应该由数据库生成
      displayName: editor.name,
      executablePath: editor.path,
      commandArgs: '',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }))
    log.info('扫描到的编辑器', editors)
    return { success: true, editors }
  } catch (error) {
    console.error('扫描编辑器失败:', error)
    return { success: false, editors: [] }
  }
}
