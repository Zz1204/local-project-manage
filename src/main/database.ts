import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import log from './logger'

// 数据库文件路径
const DB_PATH = path.join(app.getPath('userData'), 'database.sqlite')

// 创建数据库连接
const db = new Database(DB_PATH)

// 初始化数据库表
function initDatabase(): void {
  try {
    // 创建文件夹表
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      )
    `)

    // 创建设置表
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
      )
    `)

    log.info('数据库初始化成功')
  } catch (error) {
    log.error('数据库初始化失败:', error)
    throw error
  }
}

// 文件夹相关的数据库操作
const folderOperations = {
  // 创建文件夹
  createFolder: (name: string, parentId: number | null = null, description: string = '') => {
    const stmt = db.prepare(`
      INSERT INTO folders (name, parent_id, description)
      VALUES (?, ?, ?)
    `)

    log.info('创建文件夹', { name, parentId })
    return stmt.run(name, parentId, description)
  },

  // 获取所有文件夹
  getAllFolders: () => {
    const stmt = db.prepare('SELECT * FROM folders ORDER BY created_at')
    return stmt.all()
  },

  // 获取指定父文件夹下的所有子文件夹
  getChildFolders: (parentId: number | null) => {
    const stmt = db.prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY created_at')
    return stmt.all(parentId)
  },

  // 更新文件夹
  updateFolder: (id: number, name: string, description: string) => {
    const stmt = db.prepare(`
      UPDATE folders
      SET name = ?, description = ?, updated_at = strftime('%s', 'now') * 1000
      WHERE id = ?
    `)
    log.info('更新文件夹', { id, name, description })
    return stmt.run(name, description, id)
  },

  // 删除文件夹
  deleteFolder: (id: number) => {
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?')
    log.info('删除文件夹', { id })
    return stmt.run(id)
  }
}

// 设置相关的数据库操作
const settingsOperations = {
  // 获取设置
  getSetting: (key: string) => {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    const result = stmt.get(key)
    log.info('获取设置', { key, result })
    return result ? result.value : null
  },

  // 设置值
  setSetting: (key: string, value: string) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, strftime('%s', 'now') * 1000)
    `)
    log.info('设置值', { key, value })
    return stmt.run(key, value)
  }
}

// 初始化数据库
initDatabase()

export { folderOperations, settingsOperations }
