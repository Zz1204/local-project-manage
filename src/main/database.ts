import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import log from './logger'

// 数据库文件路径
const DB_PATH = path.join(app.getPath('userData'), 'database.sqlite')

// 创建数据库连接
const db = new Database(DB_PATH)

// 检查表是否存在
function tableExists(tableName: string): boolean {
  const stmt = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name=?
  `)
  return stmt.get(tableName) !== undefined
}

// 检查列是否存在
function columnExists(tableName: string, columnName: string): boolean {
  const stmt = db.prepare(`
    PRAGMA table_info(${tableName})
  `)
  const columns = stmt.all()
  return columns.some((col: any) => col.name === columnName)
}

// 添加列（如果不存在）
function addColumnIfNotExists(
  tableName: string,
  columnName: string,
  columnDefinition: string
): void {
  if (!columnExists(tableName, columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`)
    log.info(`添加列 ${columnName} 到表 ${tableName}`)
  }
}

// 初始化数据库
function initDatabase(): void {
  try {
    // 创建文件夹表（如果不存在）
    if (!tableExists('folders')) {
      db.exec(`
        CREATE TABLE folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER,
          description TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
        )
      `)
    }

    // 创建设置表（如果不存在）
    if (!tableExists('settings')) {
      db.exec(`
        CREATE TABLE settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
      `)
    }

    // 创建编辑器表（如果不存在）
    if (!tableExists('editors')) {
      db.exec(`
        CREATE TABLE editors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          display_name TEXT NOT NULL,
          executable_path TEXT NOT NULL,
          command_args TEXT,
          is_default INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
        )
      `)
    } else {
      // 检查并添加缺失的列
      addColumnIfNotExists('editors', 'display_name', 'TEXT NOT NULL')
      addColumnIfNotExists('editors', 'executable_path', 'TEXT NOT NULL')
      addColumnIfNotExists('editors', 'command_args', 'TEXT')
      addColumnIfNotExists('editors', 'is_default', 'INTEGER DEFAULT 0')
      addColumnIfNotExists(
        'editors',
        'created_at',
        'INTEGER DEFAULT (strftime("%s", "now") * 1000)'
      )
      addColumnIfNotExists(
        'editors',
        'updated_at',
        'INTEGER DEFAULT (strftime("%s", "now") * 1000)'
      )
    }

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

// 编辑器相关的数据库操作
const editorOperations = {
  // 创建编辑器
  createEditor: (
    displayName: string,
    executablePath: string,
    commandArgs: string = '',
    isDefault: boolean = false
  ) => {
    const stmt = db.prepare(`
      INSERT INTO editors (display_name, executable_path, command_args, is_default)
      VALUES (?, ?, ?, ?)
    `)

    log.info('创建编辑器', { displayName })
    let result = stmt.run(displayName, executablePath, commandArgs, isDefault ? 1 : 0)
    log.info('创建编辑器结果', { result })
    return { success: result.changes > 0 }
  },

  // 获取所有编辑器
  getAllEditors: () => {
    const stmt = db.prepare(`
      SELECT
        id,
        display_name as displayName,
        executable_path as executablePath,
        command_args as commandArgs,
        is_default as isDefault,
        created_at as createdAt,
        updated_at as updatedAt
      FROM editors
      ORDER BY created_at
    `)
    return stmt.all()
  },

  // 获取默认编辑器
  getDefaultEditor: () => {
    const stmt = db.prepare('SELECT * FROM editors WHERE is_default = 1 LIMIT 1')
    return stmt.get()
  },

  // 更新编辑器
  updateEditor: (
    id: number,
    displayName: string,
    executablePath: string,
    commandArgs: string,
    isDefault: boolean
  ) => {
    const stmt = db.prepare(`
      UPDATE editors
      SET display_name = ?, executable_path = ?, command_args = ?, is_default = ?, updated_at = strftime('%s', 'now') * 1000
      WHERE id = ?
    `)
    log.info('更新编辑器', { id, displayName })
    let result = stmt.run(displayName, executablePath, commandArgs, isDefault ? 1 : 0, id)
    log.info('更新编辑器结果', { result })
    return { success: result.changes > 0 }
  },

  // 删除编辑器
  deleteEditor: (id: number) => {
    const stmt = db.prepare('DELETE FROM editors WHERE id = ?')
    log.info('删除编辑器', { id })
    let result = stmt.run(id)
    log.info('删除编辑器结果', { result })
    return { success: result.changes > 0 }
  },

  // 设置默认编辑器
  setDefaultEditor: (id: number) => {
    const stmt1 = db.prepare('UPDATE editors SET is_default = 0')
    const stmt2 = db.prepare('UPDATE editors SET is_default = 1 WHERE id = ?')
    log.info('设置默认编辑器', { id })
    stmt1.run()
    return stmt2.run(id)
  }
}

// 初始化数据库
initDatabase()

export { folderOperations, settingsOperations, editorOperations }
