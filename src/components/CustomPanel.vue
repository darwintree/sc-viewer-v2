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
          点击或者拖动演出脚本文件到该区域来加载
        </n-text>
        <!-- <n-p depth="3" style="margin: 8px 0 0 0">
          请不要上传敏感数据，比如你的银行卡号和密码，信用卡号有效期和安全码
        </n-p> -->
      </n-upload-dragger>
    </n-upload>
    <n-tag v-if="filename">当前加载： {{ filename }}</n-tag>
    <n-button v-if="iframeJsonText" @click="postJson">更新演出</n-button>
    <EventIframe v-if="showIframe" ref="customIframe"></EventIframe>
  </n-space>
</template>
<script setup lang="ts">
import { nextTick, ref, onMounted } from 'vue'
import { parse } from 'comment-json'
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
import { getCustomJsonPath } from '../helper/path'

// const currentFile = ref(null as null | File)
const customIframe = ref<InstanceType<typeof EventIframe> | null>(null)
const showIframe = ref(false)
const filename = ref<null | string>(null)
const iframeJsonText = ref<null | string>(null)
const csvText = ref('')

onMounted(async () => {
  // const res = await fetch(getCustomJsonPath('/custom/story.json'))
  // filename.value = 'story.json'
  // iframeJsonText.value = await res.text()
  // const csvRes = await fetch(getCustomJsonPath('/custom/story.csv'))
  // csvText.value = await csvRes.text()
  // nextTick(postJson)
  // console.log(await res.text())
})

async function onFileChange(options: any) {
  console.log(options)
  filename.value = options.file.file.name
  iframeJsonText.value = await options.file.file.text()
}

function postJson() {
  showIframe.value = false
  nextTick(async () => {
    showIframe.value = true
    nextTick(() => {
      if (!iframeJsonText.value) throw new Error('current file is not init')
      customIframe.value?.postMessageOnPlayer({
        messageType: 'iframeJson',
        iframeJson: parse(iframeJsonText.value, undefined, true) as object,
        csvText: csvText.value,
      })
    })
  })
}
</script>
<style scoped></style>
