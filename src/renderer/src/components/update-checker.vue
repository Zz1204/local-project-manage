<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NSpace, NProgress, NModal, useMessage } from 'naive-ui'

const { t } = useI18n()
const message = useMessage()

// 状态
const checking = ref(false)
const downloading = ref(false)
const updateAvailable = ref(false)
const updateDownloaded = ref(false)
const updateInfo = ref<any>(null)
const downloadProgress = ref(0)
const showUpdateModal = ref(false)
const currentVersion = ref('')

// 检查更新
async function checkForUpdates() {
  if (checking.value) return

  checking.value = true
  try {
    await window.api.updater.checkForUpdates()
    // 状态会通过 IPC 事件更新
  } catch (error) {
    console.error('检查更新失败:', error)
    message.error(t('update.checkFailed'))
  } finally {
    checking.value = false
  }
}

// 下载更新
async function downloadUpdate() {
  if (downloading.value) return

  downloading.value = true
  try {
    await window.api.updater.downloadUpdate()
    // 下载进度会通过 IPC 事件更新
  } catch (error) {
    console.error('下载更新失败:', error)
    message.error(t('update.downloadFailed'))
    downloading.value = false
  }
}

// 安装更新
async function installUpdate() {
  try {
    await window.api.updater.quitAndInstall()
  } catch (error) {
    console.error('安装更新失败:', error)
    message.error(t('update.installFailed'))
  }
}

// 获取当前版本
async function getCurrentVersion() {
  try {
    currentVersion.value = await window.api.app.getVersion()
  } catch (error) {
    console.error('获取版本信息失败:', error)
  }
}

// 获取更新状态
async function getUpdateStatus() {
  try {
    const status = await window.api.updater.getStatus()
    updateAvailable.value = status.updateAvailable
    updateDownloaded.value = status.updateDownloaded
    updateInfo.value = status.updateInfo
  } catch (error) {
    console.error('获取更新状态失败:', error)
  }
}

// 监听更新事件
function setupUpdateListeners() {
  window.api.updater.onStatus((status) => {
    console.log('更新状态:', status)

    switch (status.status) {
      case 'checking-for-update':
        checking.value = true
        break
      case 'update-available':
        checking.value = false
        updateAvailable.value = true
        updateInfo.value = status.data
        showUpdateModal.value = true
        break
      case 'update-not-available':
        checking.value = false
        updateAvailable.value = false
        message.success(t('update.noUpdates'))
        break
      case 'download-progress':
        downloading.value = true
        downloadProgress.value = status.data.percent || 0
        break
      case 'update-downloaded':
        downloading.value = false
        updateDownloaded.value = true
        message.success(t('update.downloadComplete'))
        break
      case 'error':
        checking.value = false
        downloading.value = false
        message.error(`${t('update.error')}: ${status.data}`)
        break
    }
  })
}

onMounted(async () => {
  await getCurrentVersion()
  await getUpdateStatus()
  setupUpdateListeners()
})
</script>

<template>
  <div>
    <!-- 更新按钮 -->
    <NButton
      :loading="checking"
      size="small"
      @click="checkForUpdates"
      :disabled="downloading"
    >
      <template #icon>
        <div class="text-18px uno-icon:material-symbols:system-update"></div>
      </template>
      {{ t('update.check') }}
    </NButton>

    <!-- 更新对话框 -->
    <NModal
      v-model:show="showUpdateModal"
      preset="card"
      :title="t('update.newVersion')"
      style="width: 500px"
    >
      <div class="p-4">
        <div class="mb-4">
          <div class="text-lg font-bold mb-2">{{ t('update.currentVersion') }}: {{ currentVersion }}</div>
          <div class="text-lg font-bold mb-4" v-if="updateInfo">
            {{ t('update.newVersion') }}: {{ updateInfo.version }}
          </div>

          <div class="mb-4" v-if="updateInfo && updateInfo.releaseNotes">
            <div class="font-bold mb-2">{{ t('update.releaseNotes') }}:</div>
            <div class="text-sm" v-html="updateInfo.releaseNotes"></div>
          </div>

          <NProgress
            v-if="downloading"
            type="line"
            :percentage="downloadProgress"
            :show-indicator="true"
            :height="20"
          />
        </div>

        <NSpace justify="end">
          <NButton @click="showUpdateModal = false">{{ t('common.cancel') }}</NButton>
          <NButton
            v-if="!updateDownloaded"
            type="primary"
            @click="downloadUpdate"
            :loading="downloading"
            :disabled="downloading"
          >
            {{ t('update.download') }}
          </NButton>
          <NButton
            v-else
            type="primary"
            @click="installUpdate"
          >
            {{ t('update.install') }}
          </NButton>
        </NSpace>
      </div>
    </NModal>
  </div>
</template>
