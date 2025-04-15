import { PiniaPluginContext } from 'pinia'

/**
 * Pinia状态同步插件配置
 */
export interface PiniaSyncOptions {
  /**
   * 需要同步的store名称列表
   * 如果为空，则不同步任何store
   */
  syncStores?: string[]
}

/**
 * 创建Pinia状态同步插件
 * 该插件会监听指定store的变化，并通过IPC将变化广播到所有窗口
 */
export function createPiniaSyncPlugin(options: PiniaSyncOptions = {}) {
  const { syncStores = [] } = options

  // 存储取消注册函数，用于组件卸载时清理
  let unsubscribeStateChange: (() => void) | null = null

  return ({ store, app }: PiniaPluginContext) => {
    // 只有在指定的syncStores中的store才会被同步
    if (syncStores.length === 0 || syncStores.includes(store.$id)) {
      // 是否正在处理收到的状态变更，避免循环同步
      let isApplyingExternalChanges = false

      // 监听store状态变化，并广播到其他窗口
      store.$subscribe((_mutation, state) => {
        // 如果正在应用从其他窗口接收的变更，则不发送
        if (isApplyingExternalChanges) return

        // 发送状态到主进程，由主进程广播到其他窗口
        window.api.pinia.syncState(store.$id, JSON.parse(JSON.stringify(state)))
      })

      // 仅在第一次设置监听器
      if (!unsubscribeStateChange) {
        // 监听来自其他窗口的状态变更
        unsubscribeStateChange = window.api.pinia.onStateChange((data) => {
          // 只处理当前store的状态变更
          if (data.storeName === store.$id) {
            // 标记正在应用外部变更，避免循环同步
            isApplyingExternalChanges = true

            try {
              // 应用状态变更
              // 使用函数形式的$patch来应用状态变更，解决类型兼容问题
              store.$patch((state) => {
                const changes = data.stateChange as Record<string, unknown>
                // 将所有变更应用到state
                Object.keys(changes).forEach((key) => {
                  // 使用类型断言确保TypeScript编译通过
                  ;(state as Record<string, unknown>)[key] = changes[key]
                })
              })
            } finally {
              // 重置标记
              isApplyingExternalChanges = false
            }
          }
        })

        // 组件卸载时清理
        if (app) {
          const originalUnmount = app.unmount
          app.unmount = function unmount() {
            // 清理监听器
            if (unsubscribeStateChange) {
              unsubscribeStateChange()
              unsubscribeStateChange = null
            }
            return originalUnmount.call(this)
          }
        }
      }
    }

    // 返回扩展的store
    return {}
  }
}
