<script setup lang="ts">
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

const setDarkMode = async (event: MouseEvent, dark: boolean): Promise<void> => {
  const x = event.clientX
  const y = event.clientY

  const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  if (!document.startViewTransition) {
    themeStore.setThemeMode(dark ? 'dark' : 'light')
    return
  }

  const transition = document.startViewTransition(() => {
    themeStore.setThemeMode(dark ? 'dark' : 'light')
  })

  await transition.ready

  const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`]

  document.documentElement.animate(
    {
      clipPath: themeStore.theme === 'dark' ? clipPath : [...clipPath].reverse()
    },
    {
      duration: 400,
      easing: 'ease-in',
      pseudoElement:
        themeStore.theme === 'dark' ? '::view-transition-new(root)' : '::view-transition-old(root)'
    }
  )
}
</script>

<template>
  <div class="flex items-center justify-center cursor-pointer">
    <div
      v-if="themeStore.theme === 'dark'"
      @click="setDarkMode($event, false)"
      class="text-28px uno-icon:line-md:sunny-filled-loop-to-moon-filled-loop-transition"
    ></div>
    <div
      v-else
      @click="setDarkMode($event, true)"
      class="text-28px uno-icon:line-md:moon-filled-to-sunny-filled-loop-transition"
    ></div>
  </div>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) {
  z-index: 9999;
}
::view-transition-new(root) {
  z-index: 1;
}
.dark::view-transition-old(root) {
  z-index: 1;
}
.dark::view-transition-new(root) {
  z-index: 9999;
}
</style>
