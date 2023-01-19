// TranslationPanel.vue

<script setup lang="ts">
import Communication from './Communication.vue';
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';


const route = useRoute()
const router = useRouter()

const query = computed(()=>{
  return route.query
})

let csvUrl = ref('');
let communication = ref<InstanceType<typeof Communication> | null>(null);

// if this page is never loaded, onMounted will activate
onMounted(()=>{
  removeForceReloadParamInSearch()
  const mode = (new URLSearchParams(window.location.search)).get("mode")
  if (mode === "storage") {
    if(location.hash) {
      location.hash = decodeURIComponent(location.hash)
      const name = decodeURIComponent(location.hash.substring(1))
      nextTick(()=>communication.value?.loadDataFromLocalStorage(name))
    }
  } else {
    if(location.hash) {
      location.hash = decodeURIComponent(location.hash)
      csvUrl.value = decodeURIComponent(location.hash.substring(1))
      nextTick(()=>communication.value?.loadDataFromUrl(csvUrl.value))
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

function loadDataFromUrl(url: string) {
  location.hash = url
  location.search = ""
  communication.value?.loadDataFromUrl(url);
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;

  if (files && files.length > 0) {
    const file = files[0];
    if (communication.value !== null) {
      csvUrl.value = ""
      window.location.hash = ""
      communication.value?.loadDataFromFile(file)
    }
  }
}

function toGithub() {
  if (csvUrl.value) {
    window.open(csvUrl.value)
  }
  else {
    window.open("https://github.com/ShinyGroup/SCTranslationData/tree/master/data/story")
  }
}

let iconSrc = computed(()=>{
  return "github.png"
})

</script>
<template>
    <div class="input-row">
      <input v-model="csvUrl" placeholder="Enter json path or Github CSV URL" class="url-input" @keypress.enter="confirm"/>
      <button @click="confirm">Confirm</button>
      <img class="github" :src="iconSrc" @click="toGithub" />
    </div>
    <div class="input-row">
      <label> or </label>
      <input type="file" @change="handleFileChange" class="file-selector"/>
    </div>
    <Communication :csvUrl="csvUrl" ref="communication" @load-data="loadDataFromUrl"/>
</template>
<style scoped>
.input-row {
  display: flex;
  flex: 8;
  align-items: center;
}

.input-row > .url-input {
  flex: 5;
  height: 100%;
  font-size: medium;
}

.github {
  height: 30px;
  cursor: pointer;
}

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