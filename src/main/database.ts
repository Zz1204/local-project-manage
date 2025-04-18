import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import log from './logger'
import { Editor } from '../renderer/src/types/editor'

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

    // 创建项目表（如果不存在）
    if (!tableExists('projects')) {
      db.exec(`
        CREATE TABLE projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          editor_id INTEGER,
          folder_id INTEGER,
          version_control_tool TEXT,
          branch TEXT,
          is_favorite INTEGER DEFAULT 0,
          last_open_time INTEGER,
          path TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (editor_id) REFERENCES editors(id) ON DELETE SET NULL,
          FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        )
      `)
    } else {
      // 检查并添加缺失的列
      addColumnIfNotExists('projects', 'last_open_time', 'INTEGER')
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
  updateEditor: (id: number, editor: Partial<Editor>) => {
    const updates: string[] = []
    const values: any[] = []

    // 动态构建 SET 子句
    if (editor.displayName !== undefined) {
      updates.push('display_name = ?')
      values.push(editor.displayName)
    }
    // 关键：仅在提供了非空 executablePath 时才更新
    if (editor.executablePath !== undefined && editor.executablePath !== null) {
      updates.push('executable_path = ?')
      values.push(editor.executablePath)
    } else if (editor.executablePath === null) {
      // 如果显式传递了 null，则需要处理（取决于业务逻辑，这里先报错或忽略）
      // 目前的 NOT NULL 约束不允许设置为 null，所以这里应该避免或抛出错误
      log.warn('尝试将 executable_path 更新为 null，已忽略', { id })
      // 或者抛出错误：throw new Error('executable_path 不能为空')
    }
    if (editor.commandArgs !== undefined) {
      updates.push('command_args = ?')
      values.push(editor.commandArgs)
    }
    if (editor.isDefault !== undefined) {
      updates.push('is_default = ?')
      values.push(editor.isDefault ? 1 : 0)
    }

    // 如果没有要更新的字段，则直接返回
    if (updates.length === 0) {
      log.info('没有需要更新的编辑器字段', { id })
      return { success: true } // 或者返回 false 表示未更新？
    }

    // 添加 updated_at 更新
    updates.push("updated_at = strftime('%s', 'now') * 1000")
    values.push(id) // 将 id 添加到值的末尾用于 WHERE 子句

    const stmt = db.prepare(`
      UPDATE editors
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    log.info('更新编辑器', { id, updates: editor })
    try {
      const result = stmt.run(...values)
      log.info('更新编辑器结果', { result })
      return { success: result.changes > 0 }
    } catch (error) {
      log.error('数据库更新编辑器失败:', error)
      throw error
    }
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

// 项目相关的数据库操作
const projectOperations = {
  // 创建项目
  createProject: (project: {
    name: string
    description: string
    editorId: number | null
    folderId: number | null
    versionControlTool: string
    branch: string
    isFavorite: boolean
    path: string | null
  }) => {
    const stmt = db.prepare(`
      INSERT INTO projects (
        name, description, editor_id, folder_id,
        version_control_tool, branch, is_favorite, path
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    log.info('创建项目', project)
    const result = stmt.run(
      project.name,
      project.description,
      project.editorId,
      project.folderId,
      project.versionControlTool,
      project.branch,
      project.isFavorite ? 1 : 0,
      project.path
    )
    return { success: result.changes > 0, lastInsertRowid: result.lastInsertRowid }
  },

  // 获取所有项目（分页）
  getAllProjects: (page: number, pageSize: number, folderId: number | null) => {
    const offset = (page - 1) * pageSize
    log.info('获取所有项目', { page, pageSize, folderId })
    // 构建递归查询子文件夹的 CTE
    const folderQuery =
      folderId !== null
        ? `
      WITH RECURSIVE subfolders(id) AS (
        -- 基础查询：选择当前文件夹
        SELECT id FROM folders WHERE id = ?
        UNION ALL
        -- 递归查询：选择所有子文件夹
        SELECT f.id FROM folders f
        INNER JOIN subfolders s ON f.parent_id = s.id
      )
    `
        : ''

    // 构建项目查询条件
    const whereClause = folderId !== null ? 'WHERE folder_id IN (SELECT id FROM subfolders)' : ''

    // 构建完整的 SQL 查询
    const countStmt = db.prepare(`
      ${folderQuery}
      SELECT COUNT(*) as total
      FROM projects
      ${whereClause}
    `)

    const stmt = db.prepare(`
      ${folderQuery}
      SELECT
        id,
        name,
        description,
        editor_id as editorId,
        folder_id as folderId,
        version_control_tool as versionControlTool,
        branch,
        path,
        is_favorite as isFavorite,
        last_open_time as lastOpenTime,
        created_at as createdAt,
        updated_at as updatedAt
      FROM projects
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)

    // 执行查询
    const total = folderId !== null ? countStmt.get(folderId).total : countStmt.get().total
    const totalPages = Math.ceil(total / pageSize)
    const projects =
      folderId !== null ? stmt.all(folderId, pageSize, offset) : stmt.all(pageSize, offset)

    return { projects, total, totalPages }
  },

  // 更新项目
  updateProject: (
    id: number,
    project: {
      name?: string
      description?: string
      editorId?: number | null
      folderId?: number | null
      versionControlTool?: string
      branch?: string
      isFavorite?: boolean
      lastOpenTime?: number | null
      path?: string | null
    }
  ) => {
    const updates: string[] = []
    const values: any[] = []

    if (project.name !== undefined) {
      updates.push('name = ?')
      values.push(project.name)
    }
    if (project.description !== undefined) {
      updates.push('description = ?')
      values.push(project.description)
    }
    if (project.editorId !== undefined) {
      updates.push('editor_id = ?')
      values.push(project.editorId)
    }
    if (project.folderId !== undefined) {
      updates.push('folder_id = ?')
      values.push(project.folderId)
    }
    if (project.versionControlTool !== undefined) {
      updates.push('version_control_tool = ?')
      values.push(project.versionControlTool)
    }
    if (project.branch !== undefined) {
      updates.push('branch = ?')
      values.push(project.branch)
    }
    if (project.isFavorite !== undefined) {
      updates.push('is_favorite = ?')
      values.push(project.isFavorite ? 1 : 0)
    }
    if (project.lastOpenTime !== undefined) {
      updates.push('last_open_time = ?')
      values.push(project.lastOpenTime)
    }
    if (project.path !== undefined) {
      updates.push('path = ?')
      values.push(project.path)
    }

    updates.push("updated_at = strftime('%s', 'now') * 1000")
    values.push(id)

    const stmt = db.prepare(`
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    log.info('更新项目', project)
    const result = stmt.run(...values)
    return { success: result.changes > 0 }
  },

  // 删除项目
  deleteProject: (id: number) => {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?')
    log.info('删除项目', { id })
    const result = stmt.run(id)
    return { success: result.changes > 0 }
  }
}

// 初始化数据库
initDatabase()

export { folderOperations, settingsOperations, editorOperations, projectOperations }
