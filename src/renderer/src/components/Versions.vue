<script setup lang="ts">
import { reactive } from 'vue'

const versions = reactive({ ...window.electron.process.versions })
</script>

<template>
  <div class="versions flex items-center gap-2 text-12px">
    <div class="electron-version">Electron v{{ versions.electron }}</div>
    <div class="chrome-version">Chromium v{{ versions.chrome }}</div>
    <div class="node-version">Node v{{ versions.node }}</div>
  </div>
</template>
