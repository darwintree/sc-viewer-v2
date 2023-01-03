// TranslationPanel.vue

<script setup lang="ts">
import Communication from './Communication.vue';
import { ref, onMounted, nextTick, computed } from 'vue';
import { store } from '../store';

let csvUrl = ref('');
let communication = ref<InstanceType<typeof Communication> | null>(null);

onMounted(()=>{
  if(location.hash) {
    csvUrl.value = decodeURIComponent(location.hash.substring(1))
    nextTick(()=>communication.value?.loadDataFromUrl(csvUrl.value))
  }
})

function loadData() {
  location.hash = encodeURIComponent(csvUrl.value)
  communication.value?.loadDataFromUrl(csvUrl.value);
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;

  if (files && files.length > 0) {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;

      // pass the file text to the Communication component
      if (communication.value !== null) {
        window.location.hash = ""
        csvUrl.value = ""
        store.path = `data/story///${file.name}`
        communication.value.csvFileName = file.name;
        communication.value.loadDataFromCsvText(text);
      }
    };

    reader.readAsText(file);
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
      <input v-model="csvUrl" placeholder="Enter json path or Github CSV URL" class="url-input"/>
      <button @click="loadData">Confirm</button>
      <img class="github" :src="iconSrc" @click="toGithub" />
    </div>
    <div class="input-row">
      <label> or </label>
      <input type="file" @change="handleFileChange" class="file-selector"/>
    </div>
    <Communication :csvUrl="csvUrl" ref="communication" />
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