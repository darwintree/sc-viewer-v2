// TranslationPanel.vue

<script setup lang="ts">
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
  NSpin,
  NBadge,
  useMessage,
  NDropdown,
  NDrawer,
  NDrawerContent,
} from 'naive-ui'
import {
  LogoGithub,
  Raw,
  VolumeFileStorage,
  Renew,
  Repeat,
  UpToTop,
  Download,
} from '@vicons/carbon'
import { ref, onMounted, nextTick, computed, watch, h } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { DataMode, DataSource, store } from '../../store'
import { initTranslatedStoryIndex } from '../../helper/path'
import HistoryIcon from '../icon/HistoryIcon.vue'
import RenameIcon from '../icon/RenameIcon.vue'
import LoadingSpin from '../icon/LoadingSpin.vue'
import TaskCompleteIcon from '../icon/TaskCompleteIcon.vue'
import CsvFilenameSetter from './modal/CsvFilenameSetter.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const showSwitchModal = ref(false)
const isRotating = ref(false)
const message = useMessage()

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
  }
  if (key === 'push') {
    if (!communication.value) {
      alert('error: communication component not loaded')
      return
    }
    communication.value.updateBase64Content()
    showPushDrawer.value = true
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
  if (!route.hash) return
  const source = route.query?.source as DataSource
  if (source === DataSource.Browser) {
    store.currentMode = DataMode.History
    // why push, use replace is also ok
    router.push({
      path: route.path,
      query: {
        source: DataSource.Browser,
      },
      hash: route.hash,
    })
    const id = decodeURIComponent(route.hash.substring(1))
    csvUrl.value = id
    nextTick(() => communication.value?.loadDataFromLocalStorage(id))
  }
  // TODO: specify certain mode
  else {
    nextTick(() => loadDataFromEncodedUrl(route.hash.substring(1)))
  }
}

async function loadDataFromEncodedUrl(encodedSrcUrl: string) {
  // csvUrl.value = decodeURIComponent(encodedSrcUrl)
  csvUrl.value = encodedSrcUrl
  if (csvUrl.value.endsWith('.csv')) {
    // a url ends with .csv is expected to be a github url
    store.currentMode = DataMode.Server
    await communication.value?.loadDataFromGithubCsvUrl(encodedSrcUrl)
  } else if (csvUrl.value.endsWith('.json')) {
    // a url ends with .json is expected to be a raw json
    store.currentMode = DataMode.Raw
    await communication.value?.loadDataFromJsonPathUrl(encodedSrcUrl)
  } else {
    console.log(csvUrl.value)
    alert('unexpected url: should ends with .csv or .json')
  }
  router.replace({
    path: route.path,
    hash: `#${encodedSrcUrl}`,
    query: {
      source: DataSource.Remote,
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
      store.currentMode = DataMode.File
      router.replace({
        path: route.path,
        hash: '',
      })
      communication.value?.loadDataFromFile(file)
    }
  }
}

function confirm() {
  // assume this url is directly copied from address bar
  // so this is an encoded url
  loadDataFromEncodedUrl(csvUrl.value)
}

async function to(mode: string, id: string) {
  showSwitchModal.value = false
  router.push({
    path: route.path,
    query: {
      mode,
      forceReload: '1',
    },
    hash: `#${id}`,
  })
}

async function tryReloadStoryIndex() {
  isRotating.value = true
  await initTranslatedStoryIndex()
  message.success(t('translate.switch.reloadFinished'))
  isRotating.value = false
}

function toTop() {
  window.scrollTo({
    top: 0,
    left: 0,
  })
}

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
    <n-space vertical>
      <n-space align="center">
        <n-button
          tertiary
          type="info"
          class="mode-switch"
          @click="to(`raw`, communication?.jsonUrl!)"
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
          @click="to(`server`, translatedCsvUrl!)"
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
        <n-button
          tertiary
          type="info"
          class="mode-switch"
          @click="
            // eslint-disable-next-line prettier/prettier
            fileInput!.click();
            showSwitchModal = false
          "
        >
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
          @click="to(`history`, communication?.jsonUrl!)"
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
        <push-header></push-header>
      </template>
      <PushPanel></PushPanel>
    </n-drawer-content>
  </n-drawer>
  <!-- event from chapter change -->
  <Communication
    ref="communication"
    :csv-url="csvUrl"
    @load-data="loadDataFromEncodedUrl"
  />
  <div v-if="!!communication?.data.length" class="toolbar">
    <!-- <n-button-group> -->
    <n-space>
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
</style>
