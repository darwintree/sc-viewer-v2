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
    <n-step title="选择上传路径">
      <div class="repository-info">
        <n-input
          v-if="subCurrent !== 1"
          v-model:value="store.path"
          type="textarea"
          disabled
        ></n-input>
        <div v-else>
          <!-- <div>Path: {{ store.path }}</div> -->
          <n-input-group>
            <n-input-group-label>data/story/</n-input-group-label>
            <n-select
              v-model:value="pathCharacter"
              :options="idolOptions"
              :style="{ width: '80%', 'min-width': '120px' }"
            />
          </n-input-group>
          <n-input-group>
            <n-input-group-label>/</n-input-group-label>
            <n-input
              v-model:value="pathStory"
              placeholder="Please Input Story Name"
            />
          </n-input-group>
          <n-input-group>
            <n-input-group-label>/</n-input-group-label>
            <n-input v-model:value="pathFilename" />
          </n-input-group>
          <n-button
            type="info"
            :disabled="!suggestedFilename"
            :style="{ 'max-width': '200px' }"
            @click="useRecommend"
            >使用推荐路径</n-button
          >
        </div>
      </div>
    </n-step>
    <n-step title="上传" :disabled="!isLegalPath">
      <div v-if="subCurrent === 2">
        <n-input
          v-model:value="message"
          type="textarea"
          :placeholder="placeholder"
          :disabled="isPushing || !store.base64content"
        />

        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              type="info"
              tag="div"
              :disabled="!message || isPushing || !store.base64content"
              @click="push"
            >
              {{ updateText }}
            </n-button>
          </template>
          <span>{{ publishTooltipMessage }}</span>
        </n-tooltip>
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
  NTooltip,
  NButton,
  NSteps,
  NStep,
  NTag,
} from 'naive-ui'
import { ref, computed, WritableComputedRef } from 'vue'
import { store } from '../../../store'
import { suggestedCommunicationName } from '../../../helper/meta-interfaces'
import { idolOptions } from '../../../helper/path'
import { emit } from 'process'

const isPushing = ref(false)
const commitUrl = ref('')
const commitDate = ref('')
const updateText = computed(() => {
  return isPushing.value ? 'Updating' : 'Publish'
})
const placeholder = 'input commit message'
const message = ref('')
const subCurrent = ref(1)

const props = defineProps<{
  current: number
  currentBranch: string | null
}>()

const publishTooltipMessage = computed(() => {
  if (!store.base64content) return 'no edit is found'
  if (!message.value) return 'commit message is empty'
  return `Publish to ${username.value}:${props.currentBranch}`
})

const pathSplits: WritableComputedRef<string[]> = computed({
  get() {
    return store.path.split('/')
  },
  set(newValue: string[]) {
    store.path = newValue.join('/')
  },
})

const username = computed(() => {
  if (!store.octokitWrapper?.userMeta) return null
  return store.octokitWrapper.userMeta.username
})

const pathCharacter = computed({
  get() {
    return pathSplits.value[0]
  },
  set(newValue: string) {
    pathSplits.value[0] = newValue
    pathSplits.value = pathSplits.value
  },
})

const pathStory = computed({
  get() {
    return pathSplits.value[1]
  },
  set(newValue: string) {
    pathSplits.value[1] = newValue
    pathSplits.value = pathSplits.value
  },
})

const pathFilename = computed({
  get() {
    return pathSplits.value[2]
  },
  set(newValue: string) {
    pathSplits.value[2] = newValue
    pathSplits.value = pathSplits.value
  },
})

const subStepStatus = computed(() => {
  if (isLegalPath.value) return 'process'
  return 'error'
})

const isLegalPath = computed(() => {
  return !!pathCharacter.value && !!pathStory.value && !!pathFilename.value
})

// function checkInput() {
//   if (!pathCharacter.value) {
//     alert('idol name in path is not selected!')
//     throw new Error('idol is not selected')
//   }
//   if (!pathStory.value) {
//     alert('story name in path is empty!')
//     throw new Error('story is empty')
//   }
//   if (!pathFilename.value) {
//     alert('file name in path is empty!')
//     throw new Error('filename is empty')
//   }
//   if (!message.value) {
//     alert('commit message is empty!')
//     throw new Error('commit message is empty')
//   }
// }

const suggestedStoryname = computed(() => {
  if (store.eventsCollectionMeta) {
    if (store.eventsCollectionMeta.name.search('】') < 0) {
      return store.eventsCollectionMeta.name
    }
    const splits = store.eventsCollectionMeta.name.split('】')
    return splits[0] + '】' + splits[1].replace(' ', '')
  }
  return null
})

const suggestedFilename = computed(() => {
  if (store.jsonUrl && store.eventsCollectionMeta) {
    for (const communication of store.eventsCollectionMeta.communications) {
      if (communication.jsonPath == store.jsonUrl) {
        const name = suggestedCommunicationName(communication)
        return `${name}.csv`
      }
    }
  }
  return null
})

const suggestedCharacter = computed(() => {
  if (store.eventsCollectionMeta) {
    const { characterId } = store.eventsCollectionMeta
    if (characterId !== undefined) {
      return idolOptions[Number(characterId)].label
    }
    // 283 活动剧情
    return idolOptions[0].label
  }
  return null
})

function useRecommend() {
  if (
    !suggestedCharacter.value ||
    !suggestedFilename.value ||
    !suggestedStoryname.value
  )
    throw Error('unexpected null')
  pathCharacter.value = suggestedCharacter.value
  pathStory.value = suggestedStoryname.value
  pathFilename.value = suggestedFilename.value
}

async function push() {
  // checkInput()
  isPushing.value = true
  let result
  if (!store.octokitWrapper || !store.octokitWrapper?.userMeta)
    throw Error('unexpected empty username')
  if (!store.base64content) throw Error('Content is not set')
  try {
    result = await store.octokitWrapper.updateContent(
      store.octokitWrapper.userMeta.username,
      rootRepoName,
      `data/story/${store.path}`,
      message.value,
      store.base64content
    )
  } catch (e) {
    alert(e)
    throw e
  }
  console.log(result)
  if (!result.commit.html_url) {
    console.error('no result commit html')
    return
  }
  commitUrl.value = result.commit.html_url
  commitDate.value = result.commit.author!.date as string
  emits('commit')
  isPushing.value = false
}

// async function update() {
//   checkInput()
//   isPushing.value = true
//   let result
//   try {
//     result = await updateContent(
//       store.accessToken!,
//       `data/store/${store.path}`,
//       message.value,
//       store.base64content!,
//       store.owner,
//       store.repo
//     )
//   } catch (e: any) {
//     window.alert(e.message)
//     console.error(e)
//     throw e
//   }
//   isPushing.value = false
//   store.base64content = null
//   console.log(result)
//   commitUrl.value = result.commit.html_url
//   commitDate.value = new Date(result.commit.author.date).toLocaleTimeString()
//   message.value = ''
// }
const emits = defineEmits<{
  (e: 'commit'): void
}>()
</script>

<style scoped>
.user-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.logged-out {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.logged-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.user-info-line {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 10px;
  font-size: 1.2em;
}

.avatar {
  height: 50px;
  border-radius: 50%;
}

.actions {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 20px;
}

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
