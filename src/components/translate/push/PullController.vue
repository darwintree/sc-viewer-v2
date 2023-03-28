<template>
  <n-space vertical>
    <NTag>{{ pullStatus }}</NTag>
    <p v-if="current === 3 && !pullUrl">
      {{ t('push.steps.pr.beforeCreate') }}
    </p>
    <a v-if="pullUrl" :href="pullUrl" target="_blank">
      {{ directionMessage }}
    </a>
    <n-input-group v-if="!pullUrl && current === 3">
      <n-input
        v-model:value="title"
        :placeholder="t('push.steps.pr.placeholder')"
      ></n-input>
      <n-popconfirm
        :positive-text="t('common.confirm')"
        :negative-text="t('common.cancel')"
        @positive-click="createPull"
      >
        <template #trigger>
          <n-button type="info"> {{ t('push.steps.pr.create') }} </n-button>
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
      pullUrl.value = null
      return
    }
    const data = await store.octokitWrapper?.getOpenPR(
      rootOwner,
      rootRepoName,
      `${username.value}:${newBranch}`
    )
    if (!data || data.length == 0) {
      // console.log(data)
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
    pullUrl.value = data.html_url
  } catch (e) {
    alert(e)
  }
}

const pullUrl = ref(null as string | null)

const pullStatus = computed(() => {
  if (!pullUrl.value) return t('push.steps.pr.notCreated')
  return t('push.steps.pr.reviewing')
})

defineExpose({
  pullUrl,
})
</script>
