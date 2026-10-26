// JsonFormatSelector.vue

<script setup lang="ts">
import { NModal, NSpace, NButton, NText } from 'naive-ui'

const props = defineProps<{
  showModal: boolean
}>()

const emit = defineEmits(['close-modal', 'select-format'])

function selectFormat(format: 'sc' | 'scsp') {
  emit('select-format', format)
  emit('close-modal')
}
</script>

<template>
  <n-modal
    :show="showModal"
    @update:show="$emit('close-modal')"
    preset="card"
    style="width: 500px; max-width: 100%"
    title="选择JSON格式"
    :mask-closable="false"
  >
    <n-space vertical>
      <n-text>检测到JSON文件，请选择文件格式：</n-text>
      <n-space vertical>
        <n-button type="primary" block @click="selectFormat('sc')">
          SC格式 (标准格式)
        </n-button>
        <n-button type="primary" block @click="selectFormat('scsp')">
          SCSP格式 (数组格式)
        </n-button>
      </n-space>
      <n-text depth="3" style="font-size: 0.9em">
        SC格式：标准的JSON对象结构<br />
        SCSP格式：数组格式，每个元素包含key和text字段
      </n-text>
    </n-space>
  </n-modal>
</template>
