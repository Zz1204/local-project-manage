import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

export async function getGitStatus(projectPath: string) {
  try {
    const gitPath = path.join(projectPath)

    // 获取当前分支
    const { stdout: branchOutput } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: gitPath
    })
    const branch = branchOutput.trim()

    // 获取状态信息
    const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: gitPath })
    const modified = statusOutput.split('\n').filter((line) => line.match(/^ M/)).length
    const staged = statusOutput.split('\n').filter((line) => line.match(/^M/)).length
    const untracked = statusOutput.split('\n').filter((line) => line.match(/^\?\?/)).length

    // 获取远程分支差异
    const { stdout: remoteStatus } = await execAsync(
      'git rev-list --left-right --count origin/HEAD...HEAD',
      { cwd: gitPath }
    )
    const [behind, ahead] = remoteStatus.trim().split('\t').map(Number)

    // 获取最后一次提交信息
    const { stdout: lastCommit } = await execAsync('git log -1 --format="%H|%s|%ai"', {
      cwd: gitPath
    })
    const [hash, message, date] = lastCommit.trim().split('|')

    return {
      branch,
      isClean: statusOutput.length === 0,
      ahead,
      behind,
      modified,
      staged,
      untracked,
      lastCommit: {
        hash,
        message,
        date
      }
    }
  } catch (error) {
    console.error('获取Git状态失败:', error)
    return null
  }
}
