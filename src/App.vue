<script setup lang="ts">
import Communication from './components/Communication.vue';
import { ref, onMounted, nextTick } from 'vue';

let csvUrl = ref('');
let communication = ref<InstanceType<typeof Communication> | null>(null);

onMounted(()=>{
  if(location.hash) {
    csvUrl.value = decodeURIComponent(location.hash.substring(1))
    nextTick(()=>communication.value?.loadData())
    // communication.value?.loadData()
  }
})

function loadData() {
  // trigger the "loadData" method in the "Communication" component
    // 调用Communication组件的loadData方法
  if (csvUrl.value.startsWith("https://github.com")) {
    csvUrl.value = csvUrl.value.replace("github", "raw.githubusercontent")
    csvUrl.value = csvUrl.value.replace("/blob/", "/")
  }
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
      if (communication.value !== null)
        communication.value.loadDataFromCsvText(text);
    };

    reader.readAsText(file);
  }
}

</script>
<template>
  <div class="main">
    <div class="input-row">
      <input v-model="csvUrl" placeholder="Enter CSV URL" class="url-input"/>
      <button @click="loadData">Confirm</button>
    </div>
    <div class="input-row">
      <label> or </label>
      <input type="file" @change="handleFileChange" class="file-selector"/>
    </div>
    <Communication :csvUrl="csvUrl" ref="communication" />
  </div>
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