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
import MarkdownIt from 'markdown-it'
import HistorySaves from './HistorySaves.vue'

let changelogHtml = ref("")
let changelogBrief = ref("")

let latestUpdate = computed(()=>store.latestUpdate)

onMounted(async ()=>{
  const res = await fetch("./CHANGELOG.md")
  if (!res.ok) {
    alert("CHNANGELOG Missing")
    return
  }
  const text = (await res.text()).replaceAll("\r\n", "\n").replace("# Changelog\n\n", "");
  let regex = /##\ (.+)/g;
  let match = regex.exec(text);
  changelogHtml.value = (new MarkdownIt()).render(text)
  changelogBrief.value = `latest update: ${match![1]}`
})

</script>
<style scoped>
.changelog {
  text-align: left;
}
</style>
