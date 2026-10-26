// ExportFormatSelector.vue

<script setup lang="ts">
import { NModal, NSpace, NButton, NText } from 'naive-ui'

const props = defineProps<{
  showModal: boolean
}>()

const emit = defineEmits(['close-modal', 'select-format'])

function selectFormat(format: 'csv' | 'json') {
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
    title="选择导出格式"
    :mask-closable="false"
  >
    <n-space vertical>
      <n-text>请选择导出格式：</n-text>
      <n-space vertical>
        <n-button type="primary" block @click="selectFormat('csv')">
          CSV格式
        </n-button>
        <n-button type="primary" block @click="selectFormat('json')">
          JSON格式 (SCSP格式)
        </n-button>
      </n-space>
      <n-text depth="3" style="font-size: 0.9em">
        CSV格式：标准的CSV文件，适合表格编辑<br />
        JSON格式：SCSP格式数组，翻译内容会替换text字段
      </n-text>
    </n-space>
  </n-modal>
</template>
