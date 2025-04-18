import { createPinia } from 'pinia'
import { createPiniaSyncPlugin } from './plugins/sync-plugin'

// 创建Pinia实例
const pinia = createPinia()

// 添加多窗口同步插件
// 这里配置需要同步的store，例如'theme'和'language'
pinia.use(
  createPiniaSyncPlugin({
    syncStores: ['theme', 'language', 'editor']
  })
)

export default pinia

export { useEditorStore } from './editor'
