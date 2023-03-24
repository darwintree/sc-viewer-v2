<template>
  <n-space vertical>
    <NTag v-if="current === 3">{{ pullStatus }}</NTag>
    <a v-if="pullUrl" :href="pullUrl" target="_blank">
      {{ directionMessage }}
    </a>
    <n-input-group v-if="!pullUrl && current === 3">
      <n-input v-model:value="title" placeholder="input PR title"></n-input>
      <n-popconfirm
        :positive-text="t('common.confirm')"
        :negative-text="t('common.cancel')"
        @positive-click="createPull"
      >
        <template #trigger>
          <n-button type="info"> create </n-button>
        </template>
        {{ directionMessage }}
      </n-popconfirm>
    </n-input-group>
  </n-space>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NTag,
  NButton,
  NInput,
  NInputGroup,
  NSpace,
  NPopconfirm,
} from 'naive-ui'
import { store } from '../../../store'
import { rootOwner, rootRepoName, rootBranch } from '../../../helper/auth'

const { t } = useI18n()
const props = defineProps<{
  current: number
  currentBranch: string | null
}>()

const title = ref('')

const directionMessage = computed(() => {
  return `${rootOwner}:${rootBranch} ← ${username.value}:${props.currentBranch}`
})

const username = computed(() => {
  if (!store.octokitWrapper?.userMeta) return null
  return store.octokitWrapper.userMeta.username
})

const currentBranch = computed(() => {
  return props.currentBranch
})

watch(currentBranch, async (newVal) => {
  await updatePullUrl(newVal)
})

onMounted(async () => {
  await updatePullUrl(null)
})

async function updatePullUrl(newBranch: null | string) {
  if (!newBranch) newBranch = props.currentBranch
  try {
    if (!newBranch) {
      console.log('branch not set')
      pullUrl.value = null
      return
    }
    const data = await store.octokitWrapper?.getOpenPR(
      rootOwner,
      rootRepoName,
      `${username.value}:${newBranch}`
    )
    if (!data || data.length == 0) {
      console.log(data)
      pullUrl.value = null
      return
    }
    pullUrl.value = data[0].html_url
  } catch (e) {
    console.error(e)
  }
}

async function createPull() {
  try {
    if (!store.octokitWrapper) throw Error('octokitWrapper not created')
    const data = await store.octokitWrapper.createPR(
      rootOwner,
      rootRepoName,
      title.value,
      '',
      `${store.octokitWrapper?.userMeta?.username}:${currentBranch.value}`,
      `${rootBranch}`
    )
    console.log(data)
    pullUrl.value = data.html_url
  } catch (e) {
    alert(e)
  }
}

const pullUrl = ref(null as string | null)

const pullStatus = computed(() => {
  if (!pullUrl.value) return '输入标题，创建合并请求'
  return '等待管理员审批'
})

defineExpose({
  pullUrl,
})
</script>
