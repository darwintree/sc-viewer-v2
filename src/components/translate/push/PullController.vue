<template>
  <NTag>{{ pullStatus }}</NTag>
  <n-input-group>
    <n-input v-model:value="title"></n-input>
    <n-button @click="createPull"> create PR </n-button>
  </n-input-group>
  <a v-if="pullUrl" :href="pullUrl" target="_blank"> Github PR Link ↗</a>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { NTag, NButton, NInput, NInputGroup } from 'naive-ui'
import { store } from '../../../store'
import { rootOwner, rootRepoName } from '../../../helper/auth'
const props = defineProps<{
  current: number
  currentBranch: string | null
}>()

const title = ref('')

const currentBranch = computed(() => {
  return props.currentBranch
})

watch(currentBranch, async () => {
  await updatePullUrl()
})

onMounted(async () => {
  await updatePullUrl()
})

async function updatePullUrl() {
  try {
    if (!props.currentBranch) {
      console.log('branch not set')
      pullUrl.value = null
      return
    }
    const data = await store.octokitWrapper?.getOpenPR(
      rootOwner,
      rootRepoName,
      props.currentBranch
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
      'master'
    )
    console.log(data)
    pullUrl.value = data.html_url
  } catch (e) {
    alert(e)
  }
}

const pullUrl = ref(null as string | null)

const pullStatus = computed(() => {
  return 'PR 未创建'
})
</script>
