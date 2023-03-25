<template>
  <n-tag v-if="current === 1" :type="progressInfo.type">{{
    progressInfo.text
  }}</n-tag>
  <div v-if="initialized">
    <div v-if="!!store.octokitWrapper?.userMeta && !forkStatus">
      <n-button @click="createFork">{{
        t('push.steps.branch.createFork')
      }}</n-button>
    </div>
    <n-input-group v-if="!!forkStatus">
      <n-select
        v-model:value="currentBranch"
        :options="branchOptions"
        :disabled="current !== 1 || isLoading"
      />
      <n-popconfirm
        :positive-text="t('common.confirm')"
        :negative-text="t('common.cancel')"
        @positive-click="syncBranch"
      >
        <template #trigger>
          <n-button type="warning" :disabled="current !== 1 || isLoading">
            {{ t('push.steps.branch.update') }}
          </n-button>
        </template>
        {{ t('push.steps.branch.updateConfirm') }}
      </n-popconfirm>
      <n-popconfirm
        :positive-text="t('common.confirm')"
        :negative-text="t('common.cancel')"
        :show-icon="false"
        @positive-click="syncBranch"
      >
        <template #trigger>
          <n-button type="info" :disabled="current !== 1 || isLoading">
            <template #icon>
              <add></add>
            </template>
          </n-button>
        </template>
        <n-input
          v-model:value="newBranchName"
          :placeholder="t('push.steps.branch.createBranchPlaceholder')"
          :disabled="isLoading"
        />
        <template #action>
          <n-button type="primary" :disabled="isLoading" @click="createBranch">
            {{ t('push.steps.branch.new') }}
          </n-button>
        </template>
      </n-popconfirm>
      <!-- <n-button @click="syncBranch(true)">force update branch</n-button> -->
    </n-input-group>
    <div v-if="branchComparison && !isLoading">
      <n-tag size="tiny">aheadBy: {{ branchComparison.aheadBy }} </n-tag>
      <n-tag size="tiny">behindBy:{{ branchComparison.behindBy }} </n-tag>
      <n-tag size="tiny">status:{{ branchComparison.status }} </n-tag>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  NButton,
  NTag,
  NSelect,
  NInputGroup,
  NInputGroupLabel,
  NInput,
  NPopconfirm,
  NCollapse,
  NCollapseItem,
} from 'naive-ui'
import { Add } from '@vicons/carbon'
import { useI18n } from 'vue-i18n'
import {
  BranchComparison,
  rootOwner,
  rootRepoName,
  rootBranch,
} from '../../../helper/auth'
import { store } from '../../../store'

// workflow:
// initialization: username -> forkStatus -> defaultBranch

const { t } = useI18n()
const initialized = ref(false)
// owner is computed status username
const forkStatus = ref(
  null as {
    owner: string // owner name, same as username
    name: string // repo name
    defaultBranch: string // default branch name
  } | null
)
// set to default branch when initialized
// TODO: should be able to be selected in a future update
const currentBranch = ref(null as string | null)
const branchOptions = ref(
  [] as {
    value: string
    label: string
  }[]
)
// branch status compared with ShinyGroup/SCTranslationData:master
const branchComparison = ref(null as BranchComparison | null)
const isLoading = ref(false)
const newBranchName = ref('')

defineProps<{
  current: number
}>()

const username = computed(() => {
  if (!store.octokitWrapper?.userMeta) return null
  return store.octokitWrapper.userMeta.username
})

const progressInfo = computed(
  (): { text: string; type: 'warning' | 'error' | 'info' | 'success' } => {
    if (!initialized.value || isLoading.value)
      return { text: t('push.steps.branch.progress.loading'), type: 'warning' }
    if (!store.octokitWrapper)
      return {
        text: t('push.steps.branch.progress.promptLogin'),
        type: 'error',
      }
    if (!forkStatus.value)
      return { text: t('push.steps.branch.progress.promptFork'), type: 'error' }
    if (!currentBranch.value)
      return {
        text: t('push.steps.branch.progress.selectBranch'),
        type: 'info',
      }
    if (!branchComparison.value)
      return {
        text: t('push.steps.branch.progress.illegalBranch'),
        type: 'error',
      }
    return {
      text: t('push.steps.branch.progress.legalBranch'),
      type: 'success',
    }
  }
)

watch(username, async (newVal) => {
  if (newVal) await updateForkStatus()
  else forkStatus.value = null
})

watch(forkStatus, async (newVal) => {
  if (!newVal) {
    currentBranch.value = null
    return
  }
  // if forkStatus
  await updateAvailableBranches()
  currentBranch.value = newVal.defaultBranch
})

// update branchComparison according to currentBranch
watch(currentBranch, async (newVal) => {
  // currentBranch is set to null
  if (!newVal) {
    branchComparison.value = null
    return
  }
  await updateBranchComparison(newVal)
})

async function updateAvailableBranches() {
  if (!store.octokitWrapper || !username.value || !forkStatus.value) {
    const msg =
      'Unexpected error: no username or forkstatus when currentBranch is not null'
    alert(msg)
    console.error(username.value)
    console.error(forkStatus.value)
    throw new Error(msg)
  }
  const branches = await store.octokitWrapper.listBrancheNames(
    forkStatus.value.owner,
    forkStatus.value.name
  )
  branchOptions.value = branches.map((element) => {
    return {
      value: element,
      label: `${username.value}:${element}`,
    }
  })
}

async function updateBranchComparison(branch: string) {
  branchComparison.value = null
  if (!username.value || !forkStatus.value || !store.octokitWrapper) {
    const msg = 'Unexpected error: null dependency objects'
    alert(msg)
    console.error(username.value)
    console.error(forkStatus.value)
    throw new Error(msg)
  }
  try {
    const data = await store.octokitWrapper.getCompare(
      username.value,
      forkStatus.value.name,
      `${rootOwner}:${rootBranch}`,
      `${username.value}:${branch}`
    )
    branchComparison.value = data
  } catch (e) {
    console.error(e)
    alert(e)
    return
  }

  // if (!data) {
  //   const msg = 'Unexpected error: no comparison info'
  //   alert(msg)
  //   throw new Error(msg)
  // }
}

async function createFork() {
  if (!store.octokitWrapper) {
    throw new Error('error')
  }
  isLoading.value = true
  try {
    await store.octokitWrapper.createFork(rootOwner, rootRepoName)
  } catch (e) {
    alert(e)
    console.error(e)
  }
  const timer = setInterval(async () => {
    try {
      await updateForkStatus()
      clearInterval(timer)
      isLoading.value = false
    } catch (e) {
      console.log('fork not created')
    }
  }, 3000)
}

async function updateForkStatus() {
  if (!username.value) throw new Error('Not logged in')
  const repoMeta = await store.octokitWrapper?.getRepoMeta(
    username.value,
    rootRepoName
  )
  if (!repoMeta) throw new Error('Fork does not exists')
  if (repoMeta.fork && repoMeta.parent?.owner.login === rootOwner) {
    forkStatus.value = {
      name: repoMeta.name,
      defaultBranch: repoMeta.default_branch,
      owner: username.value,
    }
  } else {
    console.error("fork's parent is not ShinyGroup")
  }
}

async function createBranch() {
  if (!store.octokitWrapper || !username.value || !forkStatus.value)
    throw new Error('unexpected uninitialized requirements')
  isLoading.value = true
  try {
    await store.octokitWrapper.createRef(
      username.value,
      rootRepoName,
      newBranchName.value,
      rootOwner,
      rootRepoName,
      rootBranch
    )
    await updateAvailableBranches()
    currentBranch.value = newBranchName.value
  } catch (e) {
    console.error(e)
    alert(e)
  }
  isLoading.value = false
}

async function syncBranch() {
  if (!store.octokitWrapper?.userMeta)
    throw new Error('unexpected uninitialized username')
  if (!forkStatus.value) throw new Error('unexpected null forkStatus')
  if (!currentBranch.value) throw new Error('unexpected null currentBranch')
  // if (!force) {
  await store.octokitWrapper.syncBranch(
    store.octokitWrapper.userMeta.username,
    forkStatus.value.name,
    currentBranch.value
  )
  // } else {
  //   await store.octokitWrapper.forceSyncRef(
  //     store.octokitWrapper.userMeta.username,
  //     forkStatus.value.name,
  //     `refs/${rootOwner}/master`,
  //     `refs/head/${currentBranch.value}`
  //   )
  // }
  isLoading.value = true
  await updateBranchComparison(currentBranch.value)
  isLoading.value = false
}

onMounted(async () => {
  try {
    await updateForkStatus()
  } catch (e) {
    console.error(e)
  }
  initialized.value = true
})

defineEmits<{
  (e: 'next'): void
}>()

defineExpose({
  currentBranch,
  branchComparison,
  updateBranchComparison,
})
</script>
<style scoped></style>
