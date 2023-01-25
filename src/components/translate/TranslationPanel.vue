// TranslationPanel.vue

<script setup lang="ts">
import Communication from './Communication.vue';
import { NInput, NInputGroup, NButton, NIcon, NTooltip } from 'naive-ui';
import {  LogoGithub, Raw, VolumeFileStorage } from '@vicons/carbon'
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { DataSourceType, store } from '../../store'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const routeQuery = computed(()=>{
  return route.query
})

let csvUrl = ref('');
let communication = ref<InstanceType<typeof Communication> | null>(null);
let urlInput = ref<InstanceType<typeof NInput> | null>(null);

// if this page is never loaded, onMounted will activate
onMounted(()=>{
  // removeForceReloadParamInSearch()
  loadDataFromLocation()
})

async function loadDataFromLocation() {
  if (!route.hash) return
  const mode = route.query?.mode
  if (mode === "history") {
    store.currentMode = DataSourceType.History
    // why push, use replace is also ok
    router.push({
      path: route.path,
      query: {
        mode: store.currentMode
      },
      hash: `${decodeURIComponent(route.hash)}`
    })
    const id = decodeURIComponent(route.hash.substring(1))
    nextTick(()=>communication.value?.loadDataFromLocalStorage(id))
  } 
  // TODO: specify certain mode 
  else {
    nextTick(()=>loadDataFromUrl(route.hash.substring(1)))
  }
}

// if this page has been loaded for once, use watch to detect page reload requirement
watch(routeQuery, async (newQuery) => {
  if (newQuery.forceReload) {
    // delete route.query.forceReload
    // removeForceReloadParamInSearch()
    await loadDataFromLocation()
  }
})

function confirm() {
  csvUrl.value = decodeURI(csvUrl.value)
  loadDataFromUrl(csvUrl.value)
}

async function loadDataFromUrl(url: string) {
  csvUrl.value = url
  if (url.endsWith(".csv")) {
    store.currentMode = DataSourceType.Server
    await communication.value?.loadDataFromGithubCsvUrl(url)
  } else if (url.endsWith(".json")) {
    store.currentMode = DataSourceType.Raw
    await communication.value?.loadDataFromJsonPathUrl(url)
  } else {
    console.log(url)
    alert("unexpected url: should ends with .csv or .json")
  }
  router.replace({
    path: route.path,
    hash: decodeURIComponent(`#${url}`),
    query: {
      mode: store.currentMode.toString()
    }
  })
  nextTick(()=> urlInput.value?.scrollTo({
    behavior: 'smooth',
    left: 10000
  }))
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;

  if (files && files.length > 0) {
    const file = files[0];
    if (communication.value !== null) {
      csvUrl.value = ""
      store.currentMode = DataSourceType.File
      router.replace({
        path: route.path,
        query: {
          mode: store.currentMode
        },
        hash: ""
      })
      communication.value?.loadDataFromFile(file)
    }
  }
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
        <n-input v-model:value="csvUrl" placeholder="Json / CSV URL"  @keypress.enter="confirm" clearable ref="urlInput" />
        <n-button type="info" @click="confirm"> {{ t("common.confirm") }} </n-button>
        <n-tooltip :show-arrow="false" trigger="hover" v-if="!!store.currentMode">
          <template #trigger>
            <n-button tertiary type="default">
              <n-icon size="30">
                <img src="/icon/material/HistoryFilled.svg" v-if="store.currentMode==='history'" />
                <LogoGithub v-if="store.currentMode==='server'"/>
                <Raw v-if="store.currentMode==='raw'"/>
                <VolumeFileStorage v-if="store.currentMode==='file'"/>
              </n-icon>
            </n-button>
          </template>
          Current mode: {{ store.currentMode }}
        </n-tooltip>
        
      </n-input-group>
    </div>
    <div class="input-row">
      <label> or </label>
      <input type="file" @change="handleFileChange" class="file-selector"/>
    </div>
    <!-- event from chapter change -->
    <Communication :csvUrl="csvUrl" ref="communication" @load-data="loadDataFromUrl"/>
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
</style>