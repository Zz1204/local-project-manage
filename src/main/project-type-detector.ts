import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import type { ProjectType, ProjectTypeInfo } from '../renderer/src/types/project'

const readFile = promisify(fs.readFile)
const readdir = promisify(fs.readdir)

interface ProjectSignature {
  files: string[] // 特征文件
  dirs: string[] // 特征目录
  contentCheck?: {
    // 内容检查（如果需要检查文件内容）
    file: string
    pattern: RegExp
  }
}

// 项目特征签名映射
const PROJECT_SIGNATURES: Record<ProjectType, ProjectSignature> = {
  web: {
    files: ['package.json', 'index.html', 'vite.config.ts', 'vite.config.js', 'webpack.config.js'],
    dirs: ['src', 'public', 'dist']
  },
  java: {
    files: ['pom.xml', 'build.gradle', '.classpath', 'gradlew'],
    dirs: ['src/main/java', 'src/test/java']
  },
  python: {
    files: ['requirements.txt', 'setup.py', 'Pipfile', 'pyproject.toml'],
    dirs: ['venv', '.venv']
  },
  go: {
    files: ['go.mod', 'go.sum'],
    dirs: ['cmd', 'pkg', 'internal']
  },
  node: {
    files: ['package.json', 'package-lock.json', 'yarn.lock', 'tsconfig.json'],
    dirs: ['node_modules']
  },
  rust: {
    files: ['Cargo.toml', 'Cargo.lock'],
    dirs: ['src', 'target']
  },
  dotnet: {
    files: ['.csproj', '.sln', 'global.json'],
    dirs: ['bin', 'obj']
  },
  php: {
    files: ['composer.json', 'composer.lock', 'artisan'],
    dirs: ['vendor']
  },
  unknown: {
    files: [],
    dirs: []
  }
}

async function detectFramework(
  projectPath: string,
  projectType: ProjectType
): Promise<string | undefined> {
  try {
    if (projectType === 'web' || projectType === 'node') {
      const packageJsonPath = path.join(projectPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const content = await readFile(packageJsonPath, 'utf-8')
        const pkg = JSON.parse(content)
        const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }

        if (dependencies.vue) return 'Vue'
        if (dependencies.react) return 'React'
        if (dependencies.angular) return 'Angular'
        if (dependencies.svelte) return 'Svelte'
      }
    }

    if (projectType === 'java') {
      const pomPath = path.join(projectPath, 'pom.xml')
      if (fs.existsSync(pomPath)) {
        const content = await readFile(pomPath, 'utf-8')
        if (content.includes('spring-boot')) return 'Spring Boot'
        if (content.includes('spring-framework')) return 'Spring'
      }
    }

    return undefined
  } catch (error) {
    console.error('Framework detection error:', error)
    return undefined
  }
}

async function detectPackageManager(
  projectPath: string,
  projectType: ProjectType
): Promise<string | undefined> {
  const packageManagers: Record<string, string[]> = {
    'package-lock.json': ['npm'],
    'yarn.lock': ['yarn'],
    'pnpm-lock.yaml': ['pnpm'],
    'pom.xml': ['maven'],
    'build.gradle': ['gradle'],
    'requirements.txt': ['pip'],
    Pipfile: ['pipenv'],
    'poetry.lock': ['poetry'],
    'go.mod': ['go'],
    'Cargo.toml': ['cargo'],
    'composer.lock': ['composer']
  }

  for (const [file, [manager]] of Object.entries(packageManagers)) {
    if (fs.existsSync(path.join(projectPath, file))) {
      return manager
    }
  }

  return undefined
}

export async function detectProjectType(projectPath: string): Promise<ProjectTypeInfo> {
  try {
    const files = await readdir(projectPath)

    // 检查每种项目类型的特征
    for (const [type, signature] of Object.entries(PROJECT_SIGNATURES)) {
      if (type === 'unknown') continue

      const hasFiles = signature.files.some((file) => files.includes(file))
      const hasDirs = signature.dirs.some((dir) => files.includes(dir))

      if (hasFiles || hasDirs) {
        const projectType = type as ProjectType
        const framework = await detectFramework(projectPath, projectType)
        const packageManager = await detectPackageManager(projectPath, projectType)
        const language = detectLanguage(projectType)

        return {
          type: projectType,
          framework,
          language,
          packageManager
        }
      }
    }

    return {
      type: 'unknown'
    }
  } catch (error) {
    console.error('Project type detection error:', error)
    return {
      type: 'unknown'
    }
  }
}

function detectLanguage(projectType: ProjectType): string | undefined {
  switch (projectType) {
    case 'web':
      return 'JavaScript/TypeScript'
    case 'java':
      return 'Java'
    case 'python':
      return 'Python'
    case 'go':
      return 'Go'
    case 'rust':
      return 'Rust'
    case 'php':
      return 'PHP'
    default:
      return undefined
  }
}
