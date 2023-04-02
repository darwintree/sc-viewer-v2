<template>
  <n-space vertical>
    <n-upload
      :directory-dnd="false"
      :default-upload="false"
      :show-file-list="false"
      :on-change="onFileChange"
    >
      <n-upload-dragger>
        <div style="margin-bottom: 12px">
          <n-icon size="48" :depth="3">
            <json />
          </n-icon>
        </div>
        <n-text style="font-size: 16px">
          点击或者拖动文件到该区域来上传
        </n-text>
        <n-p depth="3" style="margin: 8px 0 0 0">
          请不要上传敏感数据，比如你的银行卡号和密码，信用卡号有效期和安全码
        </n-p>
      </n-upload-dragger>
    </n-upload>
    <n-tag v-if="currentFile">{{ currentFile.name }}</n-tag>
    <n-button v-if="currentFile" @click="postJson">post</n-button>
    <EventIframe v-if="currentFile" ref="customIframe"></EventIframe>
  </n-space>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import {
  NSpace,
  NUpload,
  NUploadDragger,
  NText,
  NP,
  NIcon,
  NTag,
  NButton,
} from 'naive-ui'
import EventIframe from './translate/EventIframe.vue'
import { Json } from '@vicons/carbon'

const currentFile = ref(null as null | File)
const customIframe = ref<InstanceType<typeof EventIframe> | null>(null)

function onFileChange(options: any) {
  console.log(options)
  currentFile.value = options.file.file as File
  console.log(currentFile.value)
}

async function postJson() {
  if (!currentFile.value) throw new Error('current file is not init')
  customIframe.value?.postMessageOnPlayer({
    iframeJson: JSON.parse(await currentFile.value.text()),
    csvText: undefined,
  })
}
</script>
<style scoped></style>
