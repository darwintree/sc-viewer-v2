<template>
  <n-collapse :default-expanded-names="['saves']">
    <n-collapse-item title="History Saves" name="saves">
      <history-saves />
      <template #header-extra>
        <n-tag type="info" size="small">
          latest update: {{ latestUpdate }}
        </n-tag>
      </template>
    </n-collapse-item>
    <n-collapse-item title="Recent Game Updates" name="updates">
      <div class="changelog" v-html="updatesHtml"></div> 
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ updatesBrief }}
        </n-tag>
      </template>
    </n-collapse-item>
    <n-collapse-item title="Changelog" name="changelog">
      <div class="changelog" v-html="changelogHtml"></div> 
      <template #header-extra>
        <n-tag type="info" size="small">
          {{ changelogBrief }}
        </n-tag>
      </template>
    </n-collapse-item>
  </n-collapse>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { NCollapse, NCollapseItem, NTag } from 'naive-ui';
import { store } from '../../store';
import HistorySaves from './HistorySaves.vue'

let changelogHtml = ref("")
let changelogBrief = ref("")
let updatesHtml = ref("")
let updatesBrief = ref("")

let latestUpdate = computed(()=>store.latestUpdate)

onMounted(()=>{
  loadChangelog()
  loadGameUpdates()
})

async function loadChangelog() {
  const res = await fetch("./CHANGELOG.html")
  if (!res.ok) {
    console.log("CHNANGELOG Missing")
    return
  }
  const text = await res.text()
  let regex = /<h2>(.*?)<\/h2>/;
  let match = regex.exec(text);
  changelogHtml.value = text.replace(/<h1>.*?<\/h1>/, "")
  changelogBrief.value = `latest update: ${match![1]}`
}
async function loadGameUpdates() {
  const res = await fetch("./GAMEUPDATES.html")
  if (!res.ok) {
    console.log("CHNANGELOG Missing")
    return
  }
  const text = await res.text()
  let regex = /<h2>(.*?)<\/h2>/;
  let match = regex.exec(text);
  updatesHtml.value = text.replace(/<h1>.*?<\/h1>/, "")
  updatesBrief.value = `latest update: ${match![1]}`
}

</script>
<style scoped>
.changelog {
  text-align: left;
}
</style>
