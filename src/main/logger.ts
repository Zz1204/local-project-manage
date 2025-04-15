import log from 'electron-log'
import { app } from 'electron'
import path from 'path'
import { spawn } from 'child_process'

// 设置Windows控制台编码为UTF-8
if (process.platform === 'win32') {
  try {
    // 方法1: 使用子进程设置代码页
    const cp = spawn('chcp', ['65001'], { shell: true })
    cp.on('error', (err) => {
      console.error('设置控制台编码失败:', err)
    })

    // 方法2: 使用ANSI转义序列设置UTF-8模式
    process.stdout.write('\x1b%G')
  } catch (error) {
    console.error('设置控制台编码失败:', error)
  }
}

// 配置日志格式 - 直接设置字符串格式，不使用函数
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// 日志级别
log.transports.console.level = 'debug'
log.transports.file.level = 'info'

// 文件日志路径
log.transports.file.resolvePathFn = () => {
  // Windows下使用UTF-8编码保存日志文件
  return path.join(app.getPath('userData'), 'logs/main.log')
}
// 设置日志文件最大大小为 5MB，超过该大小会自动滚动
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB

// 覆盖console对象，使所有console.log等调用使用electron-log
// 注释: 谨慎使用这种方式，可能会影响第三方库的行为
// Object.assign(console, log.functions)

// 导出配置好的日志实例
export default log
