<script setup lang="ts">
defineProps<{
  expanded?: boolean
  color?: string
}>()
</script>

<template>
  <div
    :class="[
      expanded
        ? 'uno-icon:material-symbols:folder-open-outline-rounded transform-rotate--90'
        : 'uno-icon:material-symbols:folder-outline-rounded',
      color ? `text-${color}` : ''
    ]"
  ></div>
</template>
