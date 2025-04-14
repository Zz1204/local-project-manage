import { defineConfig, presetAttributify, presetIcons, presetMini } from 'unocss'
import naiveUnoTheme from './naive-uno-theme.json'
export default defineConfig({
  presets: [
    presetMini({ dark: 'class' }),
    presetAttributify(),
    presetIcons({ prefix: 'uno-icon:' })
  ],
  // 自定义规则
  rules: [
    // ...
  ],
  // 自定义快捷方式
  shortcuts: {
    // ...
  },
  theme: {
    colors: {
      ...naiveUnoTheme
    }
  }
})
