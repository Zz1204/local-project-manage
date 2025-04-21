import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import log from './logger'

const execAsync = promisify(exec)

interface VersionControlInfo {
  tool: 'git' | 'svn' | 'hg' | null
  branch: string | null
  success: boolean
  error?: string
}

/**
 * 检测文件夹中的版本控制工具和分支信息
 * @param folderPath 文件夹路径
 * @returns 版本控制信息
 */
export async function detectVersionControl(folderPath: string): Promise<VersionControlInfo> {
  try {
    // 检查路径是否存在
    if (!fs.existsSync(folderPath)) {
      return {
        tool: null,
        branch: null,
        success: false,
        error: '路径不存在'
      }
    }

    // 检查是否为目录
    const stats = fs.statSync(folderPath)
    if (!stats.isDirectory()) {
      return {
        tool: null,
        branch: null,
        success: false,
        error: '路径不是目录'
      }
    }

    // 检测 Git
    if (fs.existsSync(path.join(folderPath, '.git'))) {
      try {
        const { stdout } = await execAsync('git branch --show-current', { cwd: folderPath })
        return {
          tool: 'git',
          branch: stdout.trim(),
          success: true
        }
      } catch (error) {
        log.error('获取Git分支失败:', error)
        return {
          tool: 'git',
          branch: null,
          success: false,
          error: '获取Git分支失败'
        }
      }
    }

    // 检测 SVN
    if (fs.existsSync(path.join(folderPath, '.svn'))) {
      try {
        const { stdout } = await execAsync('svn info', { cwd: folderPath })
        const branchMatch = stdout.match(/URL: .*\/(branches|trunk)\/([^\/]+)/)
        const branch = branchMatch ? branchMatch[2] : 'trunk'
        return {
          tool: 'svn',
          branch,
          success: true
        }
      } catch (error) {
        log.error('获取SVN信息失败:', error)
        return {
          tool: 'svn',
          branch: null,
          success: false,
          error: '获取SVN信息失败'
        }
      }
    }

    // 检测 Mercurial
    if (fs.existsSync(path.join(folderPath, '.hg'))) {
      try {
        const { stdout } = await execAsync('hg branch', { cwd: folderPath })
        return {
          tool: 'hg',
          branch: stdout.trim(),
          success: true
        }
      } catch (error) {
        log.error('获取Mercurial分支失败:', error)
        return {
          tool: 'hg',
          branch: null,
          success: false,
          error: '获取Mercurial分支失败'
        }
      }
    }

    // 没有检测到版本控制工具
    return {
      tool: null,
      branch: null,
      success: true
    }
  } catch (error) {
    log.error('检测版本控制工具失败:', error)
    return {
      tool: null,
      branch: null,
      success: false,
      error: '检测版本控制工具失败'
    }
  }
}
