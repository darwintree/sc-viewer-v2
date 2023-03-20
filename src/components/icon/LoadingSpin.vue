<template>
  <n-spin :rotate="isRotating" :size="size">
    <template #icon>
      <Renew class="mirror" />
    </template>
  </n-spin>
</template>
<script setup lang="ts">
import { NSpin } from 'naive-ui'
import { Renew } from '@vicons/carbon'

defineProps<{
  isRotating: boolean
  size: number
}>()
</script>
<style scoped>
.mirror {
  transform: rotateY(180deg);
}
</style>
