// TranslationPanel.vue

<script setup lang="ts">
import Communication from './Communication.vue';
import { NInput, NInputGroup, NButton, NIcon, NTooltip } from 'naive-ui';
import {  LogoGithub, Raw, VolumeFileStorage } from '@vicons/carbon'
import { HistoryFilled } from '@vicons/material'
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DataSourceType } from '../../store'


const route = useRoute()
const router = useRouter()

const query = computed(()=>{
  return route.query
})

let csvUrl = ref('');
let communication = ref<InstanceType<typeof Communication> | null>(null);
let urlInput = ref<InstanceType<typeof NInput> | null>(null);
const currentMode = ref("" as DataSourceType)

// if this page is never loaded, onMounted will activate
onMounted(()=>{
  removeForceReloadParamInSearch()
  const mode = (new URLSearchParams(window.location.search)).get("mode")
  if (mode === "history") {
    if(location.hash) {
      currentMode.value = DataSourceType.History
      location.hash = decodeURIComponent(location.hash)
      const name = decodeURIComponent(location.hash.substring(1))
      nextTick(()=>communication.value?.loadDataFromLocalStorage(name))
    }
  } else {
    if(location.hash) {
      location.hash = decodeURIComponent(location.hash)
      csvUrl.value = decodeURIComponent(location.hash.substring(1))
      nextTick(()=>loadDataFromUrl(csvUrl.value))
    }
  }
  
})

function removeForceReloadParamInSearch() {
  const params = new URLSearchParams(window.location.search)
  if (params.get("forceReload")) {
    params.delete("forceReload")
    window.location.search = params.toString()
  }
}

// if this page has been loaded for once, use watch to detect page reload requirement
watch(query, (newQuery) => {
  if (newQuery.forceReload) {
    // delete route.query.forceReload
    removeForceReloadParamInSearch()
  }
})

function confirm() {
  csvUrl.value = decodeURI(csvUrl.value)
  loadDataFromUrl(csvUrl.value)
}

async function loadDataFromUrl(url: string) {
  if (url.endsWith(".csv")) {
    currentMode.value = DataSourceType.Server
    await communication.value?.loadDataFromGithubCsvUrl(url)
  } else if (url.endsWith(".json")) {
    currentMode.value = DataSourceType.Raw
    await communication.value?.loadDataFromJsonPathUrl(url)
  } else {
    console.log(url)
    alert("unexpected url: should ends with .csv or .json")
  }
  router.replace({
    path: route.path,
    hash: `#${url}`,
    query: {
      mode: currentMode.value.toString()
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
      window.location.hash = ""
      currentMode.value = DataSourceType.File
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
        <n-input v-model:value="csvUrl" placeholder="Enter json path or Github CSV URL"  @keypress.enter="confirm" clearable ref="urlInput" />
        <n-button type="info" @click="confirm">Confirm</n-button>
        <n-tooltip :show-arrow="false" trigger="hover" v-if="!!currentMode">
          <template #trigger>
            <n-button tertiary type="default">
              <n-icon size="30">
                <HistoryFilled v-if="currentMode==='history'" />
                <LogoGithub v-if="currentMode==='server'"/>
                <Raw v-if="currentMode==='raw'"/>
                <VolumeFileStorage v-if="currentMode==='file'"/>
              </n-icon>
            </n-button>
          </template>
          Current mode: {{ currentMode }}
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