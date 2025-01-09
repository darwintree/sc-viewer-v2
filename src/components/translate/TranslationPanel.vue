// TranslationPanel.vue

<script setup lang="ts">
import Giscus from '@giscus/vue'
import Communication from './CommunicationLogs.vue'
import PushPanel from './push/PushPanel.vue'
import PushHeader from './push/PushHeader.vue'
import {
  NInput,
  NInputGroup,
  NButton,
  NIcon,
  NTooltip,
  NModal,
  NSpace,
  NBadge,
  useNotification,
  NDropdown,
  NDrawer,
  NDrawerContent,
} from 'naive-ui'
import {
  LogoGithub,
  Raw,
  VolumeFileStorage,
  Repeat,
  UpToTop,
  Download,
  AddComment,
  // Share,
} from '@vicons/carbon'
import { ref, onMounted, nextTick, computed, watch, h } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { store } from '../../store'
import { DataSource } from '../../helper/enum-interfaces'
import { initTranslatedStoryIndex } from '../../helper/path'
import { translateDataLines } from '../../helper/translate'
import HistoryIcon from '../icon/HistoryIcon.vue'
import RenameIcon from '../icon/RenameIcon.vue'
import OpenAIIcon from '../icon/OpenAIIcon.vue'
import LoadingSpin from '../icon/LoadingSpin.vue'
import TaskCompleteIcon from '../icon/TaskCompleteIcon.vue'
import CsvFilenameSetter from './modal/CsvFilenameSetter.vue'
import AutoTranslateModal from './modal/AutoTranslateModal.vue'
import { inject } from '@vercel/analytics'

// inject()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const showSwitchModal = ref(false)
const showDiscussionModal = ref(false)
const isRotating = ref(false)
const notification = useNotification()

const REMOTE = DataSource.Remote
const BROWSER = DataSource.Browser

const routeQuery = computed(() => {
  return route.query
})

const renderIcon = (icon: Component) => {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    })
  }
}

const completeOptions = [
  {
    label: t('translate.tab.push'),
    key: 'push',
    // disabled: true, // keep disabled as the functions are still in dev
    icon: renderIcon(LogoGithub),
  },
  {
    label: t('translate.tab.download'),
    key: 'download',
    icon: renderIcon(Download),
  },
]

const showCompleteDropdown = ref(false)
const showPushDrawer = ref(false)

function handleCompleteSelect(key: string) {
  if (key === 'download') {
    communication?.value?.downloadData()
    inject({
      beforeSend: (event) => {
        event.url = event.url.replace('/translate', '/download')
        return event
      },
    })
  }
  if (key === 'push') {
    if (!communication.value) {
      alert('error: communication component not loaded')
      return
    }
    communication.value.updateBase64Content()
    showPushDrawer.value = true
    inject({
      beforeSend: (event) => {
        event.url = event.url.replace('/translate', '/push')
        return event
      },
    })
  }
}

const csvUrl = ref('')
const communication = ref<InstanceType<typeof Communication> | null>(null)
const fileInput = ref<InstanceType<typeof HTMLInputElement> | null>(null)
const urlInput = ref<InstanceType<typeof NInput> | null>(null)
const showCsvFilenameSetter = ref(false)
// TODO: use this variable as extra reminder
const csvFilenameSetterExtraInfo = ref('')

const translatedCsvUrl = computed(() => {
  if (communication.value) return communication.value.translatedCsvUrl
  return null
})

// onMounted and watch controls when to reload data
// if this page is never loaded, onMounted will activate to load data from location url
onMounted(() => {
  loadDataFromLocation()
})
// if this page has been loaded for once, use watch to detect when to reload
// currently, the reload flag is used when clicking a history save at home page
watch(routeQuery, async (newQuery) => {
  if (newQuery.forceReload) {
    // delete route.query.forceReload
    // removeForceReloadParamInSearch()
    await loadDataFromLocation()
  }
})

async function loadDataFromLocation() {
  const source = route.query?.source as DataSource | undefined
  // storage id, should be jsonUrl
  const id = (route.query?.id || route.hash.substring(1)) as string
  if (!id) return
  if (source === DataSource.Browser) {
    // store.currentMode = DataMode.History
    // why push, use replace is also ok
    nextTick(() => loadDataFromLocalStorage(id))
  }
  // TODO: specify certain mode
  else if (source === DataSource.Remote) {
    nextTick(() => loadDataFromEncodedUrl(id))
  } else if (source === undefined) {
    // if source is not specified, load from storage with priority
    if (store.saves.saveDict[id]) {
      notification.info({
        content: t('translate.loadHistoryInfo'),
        duration: 1000,
      })
      nextTick(() => loadDataFromLocalStorage(id))
    } else {
      nextTick(() => loadDataFromEncodedUrl(id))
    }
  } else {
    console.error(`unexpected source: ${source}`)
  }
}

async function loadDataFromLocalStorage(id: string) {
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      source: DataSource.Browser,
      id: route.query.id,
    },
    // hash: route.hash,
  })
  csvUrl.value = id
  await communication.value?.loadDataFromSourceInput(id, DataSource.Browser)
}

// load data from csv (remote) url
async function loadDataFromEncodedUrl(encodedSrcUrl: string) {
  // csvUrl.value = decodeURIComponent(encodedSrcUrl)
  csvUrl.value = encodedSrcUrl
  await communication.value?.loadDataFromSourceInput(
    encodedSrcUrl,
    DataSource.Remote
  )
  router.replace({
    path: route.path,
    // hash: `#${encodedSrcUrl}`,
    query: {
      ...route.query,
      source: DataSource.Remote,
      id: encodedSrcUrl,
    },
  })
  nextTick(() =>
    urlInput.value?.scrollTo({
      behavior: 'smooth',
      left: 10000,
    })
  )
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files

  if (files && files.length > 0) {
    const file = files[0]
    if (communication.value !== null) {
      csvUrl.value = ''
      router.replace({
        path: route.path,
        hash: '',
      })
      communication.value?.loadDataFromSourceInput(file, null)
    }
  }
}

function confirm() {
  // assume this url is directly copied from address bar
  // so this is an encoded url
  loadDataFromEncodedUrl(csvUrl.value)
}

async function to(source: DataSource | undefined, id: string) {
  showSwitchModal.value = false
  router.push({
    path: route.path,
    query: {
      source,
      forceReload: '1',
      id,
    },
    // hash: `#${id}`,
  })
}

async function tryReloadStoryIndex() {
  isRotating.value = true
  await initTranslatedStoryIndex()
  notification.success({
    content: t('translate.switch.reloadFinished'),
    duration: 1000,
  })
  isRotating.value = false
}

function toTop() {
  window.scrollTo({
    top: 0,
    left: 0,
  })
}

function clickSwitch() {
  fileInput.value?.click()
  showSwitchModal.value = false
}

const showAutoTranslateModel = ref(false)

// async function translateCommunication(token: string) {
//   if (!token) {
//     alert('no access token')
//     return
//   }
//   if (!communication.value) {
//     throw new Error('no data detected')
//   }
//   const total = communication.value.data.length
//   // const offset = 15
//   const offset = 25
//   let index = 0
//   const iter = Math.ceil(total / offset)
//   let counter = 0
//   try {
//     while (index < total) {
//       notification.info({
//         title: t('translate.tab.preTranslate'),
//         meta: `${t('translate.preTranslate.processing')}:  ${counter}/${iter}`,
//         duration: 30000,
//       })
//       const data = communication.value.getCurrentData(index, offset)
//       const translatedStrings = await translateDataLines(data, {
//         token,
//         withTag: true,
//       })
//       communication.value?.setCurrentTrans(
//         translatedStrings,
//         index,
//         index + offset < total ? offset : total - index
//       )
//       index += offset
//       counter += 1
//     }
//   } catch (e: any) {
//     if (e.response) {
//       alert(e.response.data)
//     } else {
//       alert(e)
//     }
//     console.error(e)
//     return
//   }
//   notification.success({
//     title: t('translate.tab.preTranslate'),
//     meta: t('translate.preTranslate.finished'),
//     duration: 2000,
//   })
// }

async function translateCommunication(
  token: string,
  offset = 25,
  withTag = true,
  saveOnCompletion = true
) {
  if (!token) {
    alert('no access token')
    return
  }
  if (!communication.value) {
    throw new Error('no data detected')
  }
  const total = communication.value.data.length
  let index = 0
  const iter = Math.ceil(total / offset)
  // let counter = 0

  // 创建一个信号量来控制并发数
  const semaphore = {
    count: 0,
    maxCount: 4,
    acquire() {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (this.count < this.maxCount) {
            this.count++
            clearInterval(interval)
            resolve()
          }
        }, 50)
      })
    },
    release() {
      this.count--
    },
  }

  const tasks: Promise<void>[] = []

  try {
    notification.info({
      title: t('translate.tab.preTranslate'),
      meta: `${t('translate.preTranslate.processing')}: ${iter} batch(es)`,
      duration: 30000,
    })
    while (index < total) {
      await semaphore.acquire()

      tasks.push(
        (async () => {
          try {
            const currentIndex = index
            if (!communication.value)
              throw new Error('unexpected empty communication')
            const data = communication.value.getCurrentData(
              currentIndex,
              offset
            )
            const translatedStrings = await translateDataLines(data, {
              token,
              withTag,
            })
            communication.value?.setCurrentTrans(
              translatedStrings,
              currentIndex,
              currentIndex + offset < total ? offset : total - currentIndex
            )
            // counter += 1
          } catch (e: any) {
            if (e.response) {
              alert(e.response.data)
            } else {
              alert(e)
            }
            console.error(e)
          } finally {
            semaphore.release()
          }
        })()
      )

      index += offset
    }

    await Promise.all(tasks)
    if (saveOnCompletion) {
      communication.value.saveCsvToLocalstorage()
    }
  } catch (e: any) {
    console.error(e)
    return
  }

  notification.success({
    title: t('translate.tab.preTranslate'),
    meta: t('translate.preTranslate.finished'),
    duration: 2000,
  })
}

const currentDialogueCount = computed(() => {
  if (communication.value) {
    return communication.value.data.length
  }
  return 0
})

// async function share() {
//   if (
//     navigator.canShare({
//       url: location.href,
//       text: 'from https://sc-viewer.top',
//     })
//   ) {
//     console.log(location.href)
//   }
//   await navigator.share({
//     url: location.href,
//     text: 'from https://sc-viewer.top',
//   })
// }

// const supportsShare = !!navigator.share

// function toGithub() {
//   if (csvUrl.value) {
//     window.open(csvUrl.value)
//   }
//   else {
//     window.open("https://github.com/ShinyGroup/SCTranslationData/tree/master/data/story")
//   }
// }

// let iconSrc = computed(()=>{
//   return "github.png"
// })
</script>
<template>
  <div class="input-row">
    <n-input-group class="url-input">
      <n-input
        ref="urlInput"
        v-model:value="csvUrl"
        placeholder="Json / CSV URL"
        clearable
        @keypress.enter="confirm"
      />
      <n-button type="info" @click="confirm">
        {{ t('common.confirm') }}
      </n-button>
      <n-tooltip v-if="!!store.currentMode" :show-arrow="false" trigger="hover">
        <template #trigger>
          <n-badge color="transparent" type="warning">
            <n-button
              tertiary
              type="default"
              :focusable="false"
              @click="showSwitchModal = true"
            >
              <n-icon size="30">
                <HistoryIcon v-if="store.currentMode === 'history'" />
                <LogoGithub v-if="store.currentMode === 'server'" />
                <Raw v-if="store.currentMode === 'raw'" />
                <VolumeFileStorage v-if="store.currentMode === 'file'" />
              </n-icon>
            </n-button>
            <template #value>
              <n-icon color="black" size="15">
                <Repeat />
              </n-icon>
            </template>
          </n-badge>
        </template>
        {{ t(`translate.switch.title`) }}
      </n-tooltip>
    </n-input-group>
  </div>
  <div class="input-row">
    <label> or </label>
    <input
      ref="fileInput"
      type="file"
      class="file-selector"
      @change="handleFileChange"
    />
  </div>
  <n-modal
    v-model:show="showSwitchModal"
    preset="card"
    style="width: 600px; max-width: 100%"
    :title="t(`translate.switch.title`)"
  >
    <n-space vertical class="explanation">
      <n-space align="center">
        <n-button
          tertiary
          type="info"
          class="mode-switch"
          @click="to(REMOTE, communication?.jsonUrl!)"
        >
          <template #icon>
            <Raw />
          </template>
          raw
        </n-button>
        <span>
          {{ t('translate.switch.explanation.raw') }}
        </span>
      </n-space>
      <n-space align="center">
        <n-button
          tertiary
          type="info"
          :disabled="!translatedCsvUrl"
          class="mode-switch"
          @click="to(REMOTE, translatedCsvUrl!)"
        >
          <template #icon>
            <LogoGithub />
          </template>
          server
        </n-button>
        <span>
          {{ t('translate.switch.explanation.server') }}
        </span>
        <n-tooltip v-if="!translatedCsvUrl" :show-arrow="false" trigger="hover">
          <template #trigger>
            <n-button circle size="tiny" @click="tryReloadStoryIndex">
              <template #icon>
                <loading-spin
                  :is-rotating="isRotating"
                  :size="12"
                ></loading-spin>
                <!-- <n-spin :rotate="isRotating" :size="12">
                  <template #icon>
                    <Renew class="mirror" />
                  </template>
                </n-spin> -->
              </template>
            </n-button>
          </template>
          {{ t('translate.switch.reloadTooltip') }}
        </n-tooltip>
      </n-space>
      <n-space align="center">
        <n-button tertiary type="info" class="mode-switch" @click="clickSwitch">
          <template #icon>
            <VolumeFileStorage />
          </template>
          file
        </n-button>
        <span>
          {{ t('translate.switch.explanation.file') }}
        </span>
      </n-space>
      <n-space align="center">
        <n-button
          tertiary
          type="info"
          :disabled="!store.saves.getItem(communication?.jsonUrl!)"
          class="mode-switch"
          @click="to(BROWSER, communication?.jsonUrl!)"
        >
          <template #icon>
            <HistoryIcon></HistoryIcon>
          </template>
          history
        </n-button>
        <span>
          {{ t('translate.switch.explanation.history') }}
        </span>
      </n-space>
    </n-space>
  </n-modal>
  <n-modal
    v-model:show="showDiscussionModal"
    preset="card"
    style="width: 600px; max-width: 100%"
    :title="t(`translate.tab.comment`)"
  >
    <meta
      name="giscus:backlink"
      :content="`https://sc-viewer.top/translate?id=${store.jsonUrl}`"
    />
    <Giscus
      v-if="
        !!communication?.data.length &&
        !!store.jsonUrl &&
        route.path.startsWith('/translate')
      "
      id="comments"
      repo="darwintree/sc-viewer-v2"
      repo-id="R_kgDOImHNhg"
      category="Announcements"
      category-id="DIC_kwDOImHNhs4Cl3J4"
      mapping="specific"
      :term="store.jsonUrl"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="top"
      theme="preferred_color_scheme"
      lang="zh-CN"
      crossorigin="anonymous"
      async
    ></Giscus>
  </n-modal>
  <AutoTranslateModal
    v-model:show-modal="showAutoTranslateModel"
    :do-translate="translateCommunication"
    :current-dialogue-count="currentDialogueCount"
  ></AutoTranslateModal>
  <CsvFilenameSetter
    :show-modal="showCsvFilenameSetter"
    :extra-info="csvFilenameSetterExtraInfo"
    @close-csv-filename-setter="
      () => {
        showCsvFilenameSetter = false
      }
    "
    @save="() => communication?.saveCsvToLocalstorage()"
  >
  </CsvFilenameSetter>
  <n-drawer
    v-model:show="showPushDrawer"
    placement="bottom"
    height="90%"
    closable
    :auto-focus="false"
  >
    <n-drawer-content :native-scrollbar="false">
      <template #header>
        <push-header :title="t('push.header.title')"></push-header>
      </template>
      <PushPanel></PushPanel>
    </n-drawer-content>
  </n-drawer>
  <!-- event from chapter change -->
  <Communication
    ref="communication"
    :csv-url="csvUrl"
    @load-data="
      (jsonUrl) => {
        to(undefined, jsonUrl)
      }
    "
  />
  <div v-if="!!communication?.data.length" class="toolbar">
    <!-- <n-button-group> -->
    <n-space>
      <!-- <n-button @click="showAutoTranslateModel = true">openai</n-button> -->
      <div class="clickable" @click="showAutoTranslateModel = true">
        <n-icon size="18"> <OpenAIIcon /> </n-icon><br />
        <n-button text type="default" :focusable="false">
          {{ t('translate.tab.preTranslate') }}</n-button
        >
      </div>
      <div class="clickable" @click="showCsvFilenameSetter = true">
        <n-icon size="18"> <RenameIcon /> </n-icon><br />
        <n-button text type="default" :focusable="false">
          {{ t('translate.tab.rename') }}</n-button
        >
      </div>
      <div class="clickable" @click="showCompleteDropdown = true">
        <n-icon size="18">
          <TaskCompleteIcon />
        </n-icon>
        <br />
        <n-dropdown
          :show="showCompleteDropdown"
          text
          type="default"
          :focusable="false"
          :options="completeOptions"
          @select="handleCompleteSelect"
          @clickoutside="showCompleteDropdown = false"
        >
          {{ t('translate.tab.complete') }}
        </n-dropdown>
      </div>
      <div class="clickable" @click="showSwitchModal = true">
        <n-icon size="18"> <Repeat /> </n-icon><br />
        <n-button text type="default" :focusable="false">{{
          t('translate.tab.switch')
        }}</n-button>
      </div>
      <div class="clickable" @click="showDiscussionModal = true">
        <n-icon size="18"> <AddComment /> </n-icon><br />
        <n-button text type="default" :focusable="false">{{
          t('translate.tab.comment')
        }}</n-button>
      </div>
      <!-- <div v-if="supportsShare" class="clickable" @click="share">
        <n-icon size="18"> <Share /> </n-icon><br />
        <n-button text type="default" :focusable="false"> Share </n-button>
      </div> -->
      <div class="clickable" @click="toTop">
        <n-icon size="18"> <UpToTop /> </n-icon><br />
        <n-button text type="default" :focusable="false">{{
          t('translate.tab.top')
        }}</n-button>
      </div>
    </n-space>

    <!-- </n-button-group> -->
  </div>
</template>
<style scoped>
.input-row {
  display: flex;
  /* flex: 8; */
  align-items: center;
  text-align: left;
}

/* .input-row > .url-input {
  flex: 5;
  height: 100%;
  font-size: medium;
} */

/* .github {
  height: 30px;
  cursor: pointer;
} */

/* .file-selector {
  appearance: none;
  background: blue;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
} */

.file-selector {
  appearance: none;
  color: white;
  padding: 8px;
  /* border: none;
  border-radius: 4px;
  font-size: 1em; */
  color: black;
  cursor: pointer;
  flex: 3;
}

.clickable {
  cursor: pointer;
}

.mode-switch {
  width: 100px;
  /* font-family: HummingStd-E, UDKakugo_SmallPr6-B, Avenir, Helvetica, Arial, sans-serif; */
}

.mirror {
  transform: rotateY(180deg);
}

/* .tab :deep(.n-tabs-nav) {
  display: None;
} */
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  background-color: white;
  /* background: linear-gradient(to bottom, rgb(233, 245, 65), 2%, white);; */
  /* background-color: #f5f5f5; */
  padding: 10px;
}

.explanation {
  font-size: 0.9em;
}
</style>
