// CommitCard.vue

<template>
  <div v-if="commitUrl">
    <a :href="commitUrl" target="_blank" class="commit-url"> Github Link ↗</a>
    <span>{{ commitDate }}</span>
  </div>
  <n-steps
    v-if="current === 2"
    vertical
    size="small"
    :current="subCurrent"
    :status="subStepStatus"
    @update:current="
      (e) => {
        subCurrent = e
      }
    "
  >
    <n-step :title="t('push.steps.upload.selectUploadPath')">
      <div class="repository-info">
        <n-input
          v-if="subCurrent !== 1"
          v-model:value="commitFilePath"
          type="textarea"
          disabled
        ></n-input>
        <div v-else>
          <!-- <div>Path: {{ store.path }}</div> -->
          <!-- <n-input-group>
            <n-input-group-label>data/story/</n-input-group-label>
            <n-select
              v-model:value="pathCharacter"
              :options="idolOptions"
              :style="{ width: '80%', 'min-width': '120px' }"
            />
          </n-input-group> -->
          <!-- <n-input-group>
            <n-input-group-label>/</n-input-group-label>
            <n-input
              v-model:value="pathStory"
              :placeholder="t('push.steps.upload.inputStoryName')"
            />
          </n-input-group> -->
          <n-input-group>
            <n-input-group-label>tmp/</n-input-group-label>
            <n-input v-model:value="pathFilename" />
            <n-input-group-label>.csv</n-input-group-label>
          </n-input-group>
          <!-- <n-button
            type="info"
            :disabled="!hasRecommend"
            :style="{ 'max-width': '200px' }"
            @click="useRecommend"
            >{{ t('push.steps.upload.useRecommendedPath') }}</n-button
          > -->
        </div>
      </div>
    </n-step>
    <n-step
      :title="t('push.steps.upload.uploadSubstepTitle')"
      :disabled="!isLegalPath"
    >
      <div v-if="subCurrent === 2">
        <n-input
          v-model:value="message"
          type="textarea"
          :placeholder="t('push.steps.upload.inputCommitMessage')"
          :disabled="isPushing || !store.base64content"
        />
        <n-button secondary type="default" @click="useCommitTemplate">
          {{ t('push.steps.upload.useTemplate') }}</n-button
        >
        <n-popconfirm
          :positive-text="t('common.confirm')"
          :negative-text="t('common.cancel')"
          @positive-click="push"
        >
          <template #trigger>
            <n-button
              type="info"
              tag="div"
              :disabled="!message || isPushing || !store.base64content"
            >
              {{ updateText }}
            </n-button>
          </template>
          <span>{{ publishTooltipMessage }}</span>
        </n-popconfirm>
      </div>
    </n-step>
  </n-steps>
</template>

<script setup lang="ts">
import { rootRepoName } from '../../../helper/auth'
import {
  NSelect,
  NInputGroup,
  NInput,
  NInputGroupLabel,
  NButton,
  NSteps,
  NStep,
  NPopconfirm,
} from 'naive-ui'
import { ref, computed, WritableComputedRef, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { store } from '../../../store'
import { suggestedCommunicationName } from '../../../helper/meta-interfaces'
import {
  extractInfoFromUrl,
  idolOptions,
  queryTranslatedCsv,
} from '../../../helper/path'

const { t } = useI18n()
const isPushing = ref(false)
const commitUrl = ref('')
const commitDate = ref('')
const updateText = computed(() => {
  return isPushing.value
    ? t('push.steps.upload.uploading')
    : t('push.steps.upload.uploadSubstepTitle')
})
const message = ref('')
const subCurrent = ref(1)

const props = defineProps<{
  current: number
  currentBranch: string | null
}>()

const publishTooltipMessage = computed(() => {
  return `${t('push.steps.upload.publishPrefix')} ${username.value}:${
    props.currentBranch
  }`
})

// const pathSplits: WritableComputedRef<string[]> = computed({
//   get() {
//     return store.path.split('/')
//   },
//   set(newValue: string[]) {
//     store.path = newValue.join('/')
//   },
// })

const username = computed(() => {
  if (!store.octokitWrapper?.userMeta) return null
  return store.octokitWrapper.userMeta.username
})

// const pathCharacter = computed({
//   get() {
//     return pathSplits.value[0]
//   },
//   set(newValue: string) {
//     pathSplits.value[0] = newValue
//     pathSplits.value = pathSplits.value
//   },
// })

// const pathStory = computed({
//   get() {
//     return pathSplits.value[1]
//   },
//   set(newValue: string) {
//     pathSplits.value[1] = newValue
//     pathSplits.value = pathSplits.value
//   },
// })

// const pathFilename = computed({
//   get() {
//     return pathSplits.value[2]
//   },
//   set(newValue: string) {
//     pathSplits.value[2] = newValue
//     pathSplits.value = pathSplits.value
//   },
// })

const pathFilename = ref('')

onMounted(() => {
  // const pathSplits = store.path.split('/')
  pathFilename.value = store.jsonUrl.replace('.txt', '')
})

const subStepStatus = computed(() => {
  if (isLegalPath.value) return 'process'
  return 'error'
})

const isLegalPath = computed(() => {
  // return !!pathCharacter.value && !!pathStory.value && !!pathFilename.value
  return !!pathFilename.value
})

// const suggestedStoryname = computed(() => {
//   if (store.eventsCollectionMeta) {
//     if (store.eventsCollectionMeta.name.search('】') < 0) {
//       return store.eventsCollectionMeta.name
//     }
//     const splits = store.eventsCollectionMeta.name.split('】')
//     return splits[0] + '】' + splits[1].replace(' ', '')
//   }
//   return null
// })

// const suggestedFilename = computed(() => {
//   if (store.jsonUrl && store.eventsCollectionMeta) {
//     for (const communication of store.eventsCollectionMeta.communications) {
//       if (communication.jsonPath == store.jsonUrl) {
//         const name = suggestedCommunicationName(communication)
//         return `${name}.csv`
//       }
//     }
//   }
//   return null
// })

// const suggestedCharacter = computed(() => {
//   if (store.eventsCollectionMeta) {
//     const { characterId } = store.eventsCollectionMeta
//     if (characterId !== undefined) {
//       return idolOptions[Number(characterId)].label
//     }
//     // 283 活动剧情
//     return idolOptions[0].label
//   }
//   return null
// })

function useCommitTemplate() {
  message.value = `${t('push.steps.upload.templatePrefix')}${
    commitFilePath.value
  }`
}

// const hasRecommend = computed(() => {
//   return suggestedFilename.value || queryTranslatedCsv(store.jsonUrl)
// })

// function useRecommend() {
//   // if there is current translated file, don't change it
//   if (store.jsonUrl && queryTranslatedCsv(store.jsonUrl)) {
//     const { path } = extractInfoFromUrl(
//       decodeURIComponent(queryTranslatedCsv(store.jsonUrl)!)
//     )
//     store.path = path
//     return
//   }
//   if (
//     !suggestedCharacter.value ||
//     !suggestedFilename.value ||
//     !suggestedStoryname.value
//   )
//     throw Error('unexpected null')
//   pathCharacter.value = suggestedCharacter.value
//   pathStory.value = suggestedStoryname.value
//   pathFilename.value = suggestedFilename.value
// }

const commitFilePath = computed(() => {
  return `tmp/${pathFilename.value}.csv`
})

async function push() {
  // checkInput()
  isPushing.value = true
  let result
  if (!store.octokitWrapper || !store.octokitWrapper?.userMeta)
    throw Error('unexpected empty username')
  if (!store.base64content) throw Error('Content is not set')
  if (!props.currentBranch) throw Error('Branch is not set')
  try {
    result = await store.octokitWrapper.updateContent(
      store.octokitWrapper.userMeta.username,
      rootRepoName,
      props.currentBranch,
      commitFilePath.value,
      message.value,
      store.base64content
    )
  } catch (e) {
    alert(e)
    throw e
  }
  if (!result.commit.html_url) {
    console.error('no result commit html')
    return
  }
  commitUrl.value = result.commit.html_url
  commitDate.value = result.commit.author!.date as string
  emits('commit')
  isPushing.value = false
}

const emits = defineEmits<{
  (e: 'commit'): void
}>()
</script>

<style scoped>
.repository-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-bottom: 20px;
  text-align: left;
  width: 100%;
}

.commit-url {
  color: blue;
}

.n-input {
  flex-wrap: wrap;
}
</style>
