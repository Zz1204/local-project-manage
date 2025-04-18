import path from 'path'

// 编辑器配置接口
export interface EditorConfig {
  name: string
  identifier: string
  // Windows 配置
  windows?: {
    registryKeys?: Array<{
      key: string
      valueName: string
      executablePath: string
    }>
    defaultPaths?: string[]
  }
  // macOS 配置
  macos?: {
    bundleIds?: string[]
    defaultPaths?: string[]
  }
  // Linux 配置
  linux?: {
    desktopFiles?: string[]
    defaultPaths?: string[]
  }
}

// 编辑器配置列表
export const editorConfigs: EditorConfig[] = [
  {
    name: 'VSCode',
    identifier: 'vscode',
    windows: {
      registryKeys: [
        {
          key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{771FD6B0-FA20-440A-A002-3B3BAC16DC50}_is1',
          valueName: 'InstallLocation',
          executablePath: 'Code.exe'
        }
      ]
    },
    macos: {
      bundleIds: ['com.microsoft.VSCode'],
      defaultPaths: ['/Applications/Visual Studio Code.app']
    },
    linux: {
      desktopFiles: [
        path.join(process.env.HOME || '', '.local/share/applications/code.desktop'),
        '/usr/share/applications/code.desktop'
      ],
      defaultPaths: [
        '/usr/share/code/code',
        '/snap/bin/code',
        path.join(process.env.HOME || '', '.vscode/bin/code')
      ]
    }
  },
  {
    name: 'Cursor',
    identifier: 'cursor',
    windows: {
      registryKeys: [
        {
          key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{DADADADA-ADAD-ADAD-ADAD-ADADADADADAD}}_is1',
          valueName: 'InstallLocation',
          executablePath: 'cursor.exe'
        }
      ]
    }
  },
  {
    name: 'Trae',
    identifier: 'trae',
    windows: {
      registryKeys: [
        {
          key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{1082AAEF-E2C3-4ABD-8789-9861082B709F}_is1',
          valueName: 'InstallLocation',
          executablePath: 'Trae.exe'
        }
      ]
    }
  },
  {
    name: 'Sublime Text',
    identifier: 'sublime-text',
    macos: {
      bundleIds: ['com.sublimetext.4'],
      defaultPaths: ['/Applications/Sublime Text.app']
    },
    linux: {
      desktopFiles: ['/usr/share/applications/sublime_text.desktop'],
      defaultPaths: ['/opt/sublime_text/sublime_text']
    }
  },
  {
    name: 'Atom',
    identifier: 'atom',
    macos: {
      defaultPaths: ['/Applications/Atom.app']
    }
  }
]
