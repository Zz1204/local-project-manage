<script setup lang="ts">
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { useProjectStore } from '@renderer/stores/project'
import { useEditorStore } from '@renderer/stores/editor'
import { useFolderStore } from '@renderer/stores/folder'
import type { Project } from '@renderer/types/project'
import type { FormInst } from 'naive-ui'
import type { Folder } from '@renderer/types/folder'
import { useMessage } from 'naive-ui'

declare global {
  interface Window {
    electronAPI: {
      detectVersionControl: (path: string) => Promise<{
        type: string
        branch: string
      }>
    }
  }
}

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const folderStore = useFolderStore()
const message = useMessage()

// 加载数据
onMounted(async () => {
  await Promise.all([
    projectStore.loadProjects(),
    editorStore.fetchEditors(),
    folderStore.loadFolders()
  ])
})

// 分页信息
const pageInfo = ref({
  currentPage: 1,
  pageSize: 10,
  pageSizes: [10, 20, 30, 40]
})

// 监听分页变化
watch(
  () => pageInfo.value,
  (newValue) => {
    projectStore.setPagination(newValue.currentPage, newValue.pageSize)
    projectStore.loadProjects()
  },
  { deep: true }
)

// 获取编辑器名称
function getEditorName(editorId: number | null): string {
  if (!editorId) return '未设置'
  const editor = editorStore.editors.find((e) => e.id === editorId)
  return editor?.displayName || '未知编辑器'
}

// 获取文件夹名称
function getFolderName(folderId: number | null): string {
  if (!folderId) return '未设置'
  const folder = folderStore.folders.find((f) => f.id === folderId)
  return folder?.name || '未知文件夹'
}

// 表单相关
const showFormModal = ref(false)
const formRef = ref<FormInst | null>(null)
const formModel = reactive<{
  name: string
  description: string
  editorId: number | null
  folderId: number | null
  folderPath: string | null
  versionControlTool: string
  branch: string
  branchName: string | null
  isFavorite: boolean
  lastOpenTime: number | null
  path: string | null
}>({
  name: '',
  description: '',
  editorId: null,
  folderId: null,
  folderPath: null,
  versionControlTool: 'git',
  branch: 'master',
  branchName: null,
  isFavorite: false,
  lastOpenTime: null,
  path: null
})

// 表单验证规则
const rules = {
  name: {
    required: true,
    message: '请输入项目名称',
    trigger: ['blur', 'input']
  },
  path: {
    required: true,
    message: '请输入项目路径',
    trigger: ['blur', 'input']
  },
  description: {
    required: false,
    message: '请输入项目描述',
    trigger: ['blur', 'input']
  },
  folderId: {
    required: false,
    message: '请选择文件夹',
    trigger: ['blur', 'change']
  },
  versionControlTool: {
    required: true,
    message: '请选择版本控制工具',
    trigger: ['blur', 'change']
  },
  branch: {
    required: true,
    message: '请输入分支名称',
    trigger: ['blur', 'input']
  }
}

// 版本控制工具选项
const versionControlOptions = [
  { label: 'Git', value: 'git' },
  { label: 'SVN', value: 'svn' },
  { label: 'Mercurial', value: 'hg' },
  { label: '无', value: 'none' }
]

// 计算属性：模态框标题
const modalTitle = computed(() => {
  return projectStore.editingProject ? '编辑项目' : '新增项目'
})

// 打开表单模态框
function openFormModal(projectId: number | null = null) {
  // 先设置编辑状态
  projectStore.setEditingProject(projectId)

  if (projectId) {
    // 编辑模式：填充表单数据
    const project = projectStore.editingProject
    if (project) {
      console.log('编辑项目数据:', project)
      console.log('项目路径:', project.path)

      // 重置表单数据
      Object.assign(formModel, {
        name: project.name,
        description: project.description,
        editorId: project.editorId,
        folderId: project.folderId,
        folderPath: project.folderPath,
        versionControlTool: project.versionControlTool,
        branch: project.branch,
        branchName: project.branchName,
        isFavorite: project.isFavorite,
        lastOpenTime: project.lastOpenTime,
        path: project.path
      })

      console.log('表单数据:', formModel)
      console.log('表单路径:', formModel.path)
    }
  } else {
    // 新增模式：重置表单
    Object.assign(formModel, {
      name: '',
      description: '',
      editorId: null,
      folderId: null,
      folderPath: null,
      versionControlTool: 'git',
      branch: 'master',
      branchName: null,
      isFavorite: false,
      lastOpenTime: null,
      path: null
    })
  }

  showFormModal.value = true
}

// 关闭表单模态框
function closeFormModal() {
  showFormModal.value = false
  projectStore.setEditingProject(null)
}

// 提交表单
async function submitForm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const projectData = {
      name: formModel.name,
      description: formModel.description,
      editorId: formModel.editorId,
      folderId: formModel.folderId,
      folderPath: formModel.folderPath,
      versionControlTool: formModel.versionControlTool,
      branch: formModel.branch,
      branchName: formModel.branchName,
      isFavorite: formModel.isFavorite,
      lastOpenTime: formModel.lastOpenTime,
      path: formModel.path
    }

    if (projectStore.editingProject) {
      // 更新项目
      const updatedProjectData = {
        ...projectData,
        path: projectData.path || undefined // 确保 path 为 string | undefined 而不是 null
      }
      await projectStore.updateProject(projectStore.editingProject.id, updatedProjectData)
    } else {
      // 创建项目
      const projectDataWithRequiredPath = {
        ...projectData,
        path: projectData.path || '' // 确保 path 不为 null
      }
      await projectStore.createProject(projectDataWithRequiredPath)
    }

    closeFormModal()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 选择文件夹
async function selectFolder() {
  try {
    const result = await window.api.dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      formModel.path = result.filePaths[0]

      // 检测版本控制信息
      try {
        const versionControlInfo = await window.api.detectVersionControl(result.filePaths[0])
        if (versionControlInfo && versionControlInfo.success) {
          formModel.versionControlTool = versionControlInfo.tool
          formModel.branch = versionControlInfo.branch || ''
          // message.success(
          //   `检测到版本控制工具: ${versionControlInfo.tool}, 分支: ${versionControlInfo.branch || 'master'}`
          // )
        } else {
          formModel.versionControlTool = 'none'
          formModel.branch = ''
          // message.info('未检测到版本控制工具')
        }
      } catch (error) {
        console.error('检测版本控制失败:', error)
        // message.error('检测版本控制失败')
      }
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    message.error('选择文件夹失败')
  }
}

const handleFolderSelect = async (folder: Folder) => {
  formModel.folderId = folder.id
  formModel.folderPath = folder.path

  try {
    const result = await window.electronAPI.detectVersionControl(folder.path)
    if (result) {
      formModel.versionControlTool = result.type
      formModel.branchName = result.branch
    }
  } catch (error) {
    console.error('Failed to detect version control:', error)
  }
}

const handleDropdownSelect = (key: string, projectId: number) => {
  console.log('下拉菜单选择:', key, projectId)
  if (key === 'edit') {
    openFormModal(projectId)
  } else if (key === 'delete') {
    projectStore.deleteProject(projectId)
  }
}

const openProjectPath = (path: string) => {
  // 在资源管理器中打开路径
  window.api.shell.openPath(path)
}

const openProjectInEditor = (project: Project) => {
  // 打开project中关联的编辑器中打开
  if (project.editorId) {
    window.api.editor.openProject(project.editorId, project.path, project.id)
  }
}

const editors = computed(() => {
  return editorStore.editors
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      class="h-48px px-16px flex items-center justify-between b-b-1px b-b-solid b-b-dividerColor"
    >
      <div>
        <n-breadcrumb separator=">">
          <n-breadcrumb-item v-for="folder in folderStore.folderTree" :key="folder.id">
            {{ folder.name }}
          </n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div>
        <n-button type="primary" size="tiny" @click="openFormModal()">
          <template #icon>
            <div class="text-28px uno-icon:material-symbols:add"></div>
          </template>
        </n-button>
      </div>
    </div>
    <div class="flex-1 min-h-0">
      <template v-if="projectStore.projects.length">
        <n-scrollbar style="height: 100%">
          <div class="p-16px grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-16px">
            <n-card
              v-for="project in projectStore.projects"
              :key="project.id"
              :title="project.name"
              :bordered="false"
              size="huge"
              role="button"
              @click="projectStore.setSelectedProject(project.id)"
            >
              <template #header-extra>
                <n-dropdown
                  trigger="hover"
                  :options="[
                    {
                      label: '编辑',
                      key: 'edit'
                    },
                    {
                      label: '删除',
                      key: 'delete'
                    }
                  ]"
                  @select="handleDropdownSelect($event, project.id)"
                >
                  <n-button quaternary circle>
                    <template #icon>
                      <div class="text-20px uno-icon:material-symbols:more-vert"></div>
                    </template>
                  </n-button>
                </n-dropdown>
              </template>
              <n-space vertical>
                <n-text depth="3">{{ project.description }}</n-text>
                <n-space>
                  <n-tag size="small" @click="openProjectInEditor(project)">
                    {{ getEditorName(project.editorId) }}
                  </n-tag>
                  <n-tag size="small" type="success">
                    {{ project.versionControlTool }}
                  </n-tag>
                  <n-tag size="small" type="warning">
                    {{ project.branch }}
                  </n-tag>
                </n-space>
                <n-text depth="3" @click="openProjectPath(project.path)">
                  项目路径：{{ project.path || '未设置' }}
                </n-text>
                <n-text depth="3">
                  最后打开时间：{{
                    project.lastOpenTime
                      ? new Date(project.lastOpenTime).toLocaleString()
                      : '从未打开'
                  }}
                </n-text>
              </n-space>
            </n-card>
          </div>
        </n-scrollbar>
      </template>
      <template v-else>
        <div class="h-full flex items-center justify-center">
          <n-empty size="large" />
        </div>
      </template>
    </div>
    <div class="h-48px px-16px flex items-center justify-end b-t-1px b-t-solid b-t-dividerColor">
      <n-pagination
        v-model:page="pageInfo.currentPage"
        v-model:page-size="pageInfo.pageSize"
        :page-count="projectStore.pagination.total"
        :page-sizes="pageInfo.pageSizes"
        size="small"
        show-quick-jumper
        show-size-picker
      />
    </div>

    <!-- 项目表单模态框 -->
    <n-modal v-model:show="showFormModal" preset="card" :title="modalTitle" style="width: 600px">
      <n-form
        ref="formRef"
        :model="formModel"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="项目名称" path="name">
          <n-input v-model:value="formModel.name" placeholder="请输入项目名称" />
        </n-form-item>
        <n-form-item label="项目路径" path="path">
          <n-input-group>
            <n-input v-model:value="formModel.path" placeholder="请输入项目路径" />
            <n-button @click="selectFolder">
              <template #icon>
                <div class="text-20px uno-icon:material-symbols:folder-open"></div>
              </template>
            </n-button>
          </n-input-group>
        </n-form-item>
        <n-form-item label="编辑器" path="editorId">
          <n-select
            v-model:value="formModel.editorId"
            :options="
              editors.map((editor) => ({
                label: editor.displayName,
                value: editor.id
              }))
            "
            placeholder="请选择编辑器"
            clearable
          />
        </n-form-item>
        <n-form-item label="项目描述" path="description">
          <n-input
            v-model:value="formModel.description"
            type="textarea"
            placeholder="请输入项目描述"
          />
        </n-form-item>

        <!-- <n-form-item label="文件夹" path="folderId">
          <n-select
            v-model:value="formModel.folderId"
            :options="
              folderStore.folders.map((folder) => ({
                label: folder.name,
                value: folder.id
              }))
            "
            placeholder="请选择文件夹"
            clearable
            @update:value="handleFolderSelect"
          />
        </n-form-item>
        <n-form-item label="版本控制工具" path="versionControlTool">
          <n-select
            v-model:value="formModel.versionControlTool"
            :options="versionControlOptions"
            placeholder="请选择版本控制工具"
          />
        </n-form-item>
        <n-form-item label="分支名称" path="branch">
          <n-input v-model:value="formModel.branch" placeholder="请输入分支名称" />
        </n-form-item> -->
        <!-- <n-form-item label="收藏状态" path="isFavorite">
          <n-switch v-model:value="formModel.isFavorite" />
        </n-form-item> -->
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-12px">
          <n-button @click="closeFormModal">取消</n-button>
          <n-button type="primary" @click="submitForm">确定</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped></style>
